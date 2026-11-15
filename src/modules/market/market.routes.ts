import { Router } from 'express'
import { getCandles } from './market.candles.js'
import { candlesParamsSchema, candlesQuerySchema } from './market.schemas.js'
import { priceStore } from './market.store.js'

export const marketRouter = Router()

// GET /api/market/prices → latest price for every coin
marketRouter.get('/prices', (_req, res) => {
  res.json(priceStore.all())
})

// GET /api/market/candles/BTC?granularity=3600
marketRouter.get('/candles/:symbol', async (req, res) => {
  const { symbol } = candlesParamsSchema.parse(req.params)
  const { granularity } = candlesQuerySchema.parse(req.query)
  const candles = await getCandles(symbol, granularity)
  res.json({ symbol, granularity, candles })
})
