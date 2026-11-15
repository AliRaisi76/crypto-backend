import ky from 'ky'
import WebSocket from 'ws'
import { COINS } from '../../config/coins.js'
import { logger } from '../../lib/logger.js'
import type { PriceStore } from './market.store.js'

const log = logger.child({ module: 'market-feed' })

const MIN_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000

interface BulletResponse {
  code: string
  data: {
    token: string
    instanceServers: { endpoint: string; pingInterval: number }[]
  }
}

interface SnapshotData {
  symbol: string
  lastTradedPrice: string
  high: string
  low: string
  vol: string
  changeRate: string // a fraction, e.g. 0.012 means +1.2%
}

interface KucoinMessage {
  type: string
  topic?: string
  data?: { data?: SnapshotData } | string
}

export function startMarketFeed(store: PriceStore): () => void {
  const symbols = COINS.map((c) => `${c.symbol}-USDT`)
  let ws: WebSocket | undefined
  let pingTimer: NodeJS.Timeout | undefined
  let retryTimer: NodeJS.Timeout | undefined
  let backoff = MIN_BACKOFF_MS
  let stopped = false

  function handleMessage(raw: string): void {
    const msg = JSON.parse(raw) as KucoinMessage

    if (msg.type === 'error') {
      log.error({ message: msg.data }, 'KuCoin rejected a message')
      return
    }
    if (msg.type !== 'message' || !msg.topic?.startsWith('/market/snapshot:'))
      return

    const d = typeof msg.data === 'object' ? msg.data?.data : undefined
    if (!d) return

    store.set({
      symbol: d.symbol.replace('-USDT', ''),
      price: Number(d.lastTradedPrice),
      change24h: Math.round(Number(d.changeRate) * 10_000) / 100,
      high24h: Number(d.high),
      low24h: Number(d.low),
      volume24h: Number(d.vol),
      updatedAt: Date.now(),
    })
  }

  function scheduleRetry(): void {
    if (stopped) return
    log.warn({ retryInMs: backoff }, 'disconnected, retrying')
    retryTimer = setTimeout(() => void connect(), backoff)
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
  }

  async function connect(): Promise<void> {
    if (stopped) return
    try {
      // Each connection needs a fresh token and server address
      const res = await ky
        .post('https://api.kucoin.com/api/v1/bullet-public', {
          timeout: 10_000,
        })
        .json<BulletResponse>()
      const server = res.data.instanceServers[0]
      if (!server) throw new Error('KuCoin returned no WebSocket servers')
      const url = `${server.endpoint}?token=${res.data.token}&connectId=${Date.now()}`

      ws = new WebSocket(url)

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as KucoinMessage
          if (msg.type === 'welcome') {
            // Subscribe to one snapshot topic per coin
            for (const symbol of symbols) {
              ws?.send(
                JSON.stringify({
                  id: Date.now(),
                  type: 'subscribe',
                  topic: `/market/snapshot:${symbol}`,
                  response: true,
                }),
              )
            }
            // Keep the connection alive at the interval the server asked for
            pingTimer = setInterval(() => {
              ws?.send(JSON.stringify({ id: Date.now(), type: 'ping' }))
            }, server.pingInterval)
            backoff = MIN_BACKOFF_MS
            log.info({ coins: symbols.length }, 'connected to KuCoin')
            return
          }
          handleMessage(data.toString())
        } catch (err) {
          log.warn({ err }, 'bad message from KuCoin')
        }
      })

      ws.on('error', (err) => log.error({ err: err.message }, 'socket error'))

      ws.on('close', () => {
        clearInterval(pingTimer)
        scheduleRetry()
      })
    } catch (err) {
      log.error({ err: (err as Error).message }, 'could not get KuCoin token')
      scheduleRetry()
    }
  }

  void connect()

  return () => {
    stopped = true
    clearInterval(pingTimer)
    clearTimeout(retryTimer)
    ws?.close()
  }
}
