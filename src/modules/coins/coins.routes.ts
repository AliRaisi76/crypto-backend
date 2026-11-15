import { Router } from 'express'
import { COINS } from '../../config/coins.js'
import { notFound } from '../../lib/errors.js'
import { priceStore } from '../market/market.store.js'

export const coinsRouter = Router()

// GET /api/coins → every coin with its latest price (if loaded)
coinsRouter.get('/', (_req, res) => {
  res.json(
    COINS.map((coin) => ({
      ...coin,
      price: priceStore.get(coin.symbol) ?? null,
    })),
  )
})

// GET /api/coins/BTC
coinsRouter.get('/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase()
  const coin = COINS.find((c) => c.symbol === symbol)
  if (!coin) throw notFound('Coin not found')
  res.json({ ...coin, price: priceStore.get(symbol) ?? null })
})
