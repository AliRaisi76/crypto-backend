import { createServer } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { startMarketFeed } from './modules/market/market.feed.js'
import { priceStore } from './modules/market/market.store.js'
import { startRealtimeGateway } from './modules/realtime/realtime.gateway.js'

const httpServer = createServer(createApp())

const stopFeed = startMarketFeed(priceStore)
const stopGateway = startRealtimeGateway(httpServer, priceStore)

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API listening')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down')
  setTimeout(() => process.exit(1), 10_000).unref() // force exit if stuck
  stopFeed()
  await stopGateway()
  httpServer.close(() => process.exit(0))
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
