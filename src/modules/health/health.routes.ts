import { Router } from 'express'
import { priceStore } from '../market/market.store.js'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

healthRouter.get('/ready', (_req, res) => {
  const pricesLoaded = priceStore.all().length
  res
    .status(pricesLoaded > 0 ? 200 : 503)
    .json({ ready: pricesLoaded > 0, pricesLoaded })
})
