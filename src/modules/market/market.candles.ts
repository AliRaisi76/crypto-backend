import ky from 'ky'
import { upstreamError } from '../../lib/errors.js'
import { logger } from '../../lib/logger.js'
import { TtlCache } from '../../lib/ttl-cache.js'
import type { Candle } from './market.types.js'
import { env } from '../../config/env.js'

const http = ky.create({
  prefix: 'https://api.kucoin.com/api/v1/',
  timeout: 10_000,
  retry: { limit: 2 },
  headers: { 'User-Agent': 'crypto-backend' },
})

// Our granularity (seconds) → KuCoin's interval name
const INTERVALS: Record<number, string> = {
  60: '1min',
  300: '5min',
  900: '15min',
  3600: '1hour',
  21600: '6hour',
  86400: '1day',
}

// KuCoin's raw candle: [time, open, close, high, low, volume, turnover], all strings
type RawCandle = [string, string, string, string, string, string, string]

interface CandlesResponse {
  code: string
  data: RawCandle[]
}

const cache = new TtlCache<Candle[]>(env.CANDLE_TTL_MS)

export function getCandles(
  symbol: string,
  granularity: number,
): Promise<Candle[]> {
  return cache.get(`${symbol}:${granularity}`, () =>
    fetchCandles(symbol, granularity),
  )
}

async function fetchCandles(
  symbol: string,
  granularity: number,
): Promise<Candle[]> {
  try {
    const res = await http
      .get('market/candles', {
        searchParams: {
          symbol: `${symbol}-USDT`,
          type: INTERVALS[granularity],
        },
      })
      .json<CandlesResponse>()

    return res.data
      .map(([time, open, close, high, low, volume]) => ({
        time: Number(time),
        open: Number(open),
        close: Number(close),
        high: Number(high),
        low: Number(low),
        volume: Number(volume),
      }))
      .sort((a, b) => a.time - b.time)
  } catch (err) {
    logger.warn({ err: (err as Error).message, symbol }, 'candle fetch failed')
    throw upstreamError()
  }
}
