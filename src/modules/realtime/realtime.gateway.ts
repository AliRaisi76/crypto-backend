import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import type { PriceStore } from '../market/market.store.js'

const PUSH_INTERVAL_MS = 1_000

export function startRealtimeGateway(
  httpServer: HttpServer,
  store: PriceStore,
) {
  const io = new Server(httpServer, { cors: { origin: env.CORS_ORIGIN } })

  io.on('connection', (socket) => {
    logger.info({ id: socket.id }, 'client connected')
    socket.emit('prices:snapshot', store.all())
  })

  const timer = setInterval(() => {
    if (io.engine.clientsCount === 0) return // nobody listening, keep changes queued
    const changes = store.takeChanges()
    if (changes.length > 0) io.emit('prices:update', changes)
  }, PUSH_INTERVAL_MS)

  return async () => {
    clearInterval(timer)
    await io.close()
  }
}
