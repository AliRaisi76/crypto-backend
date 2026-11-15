import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/error.middleware.js'
import { coinsRouter } from './modules/coins/coins.routes.js'
import { healthRouter } from './modules/health/health.routes.js'
import { marketRouter } from './modules/market/market.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json())

  app.use(healthRouter)
  app.use('/api/coins', coinsRouter)
  app.use('/api/market', marketRouter)

  // Order matters: these two must come last
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
