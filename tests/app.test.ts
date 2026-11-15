import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { priceStore } from '../src/modules/market/market.store.js'
import { COINS } from '../src/config/coins.js'

const app = createApp()

describe('API', () => {
  beforeEach(() => {
    priceStore.takeChanges()
  })

  it('GET /health is always ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })

  it('GET /ready is 503 until prices arrive, then 200', async () => {
    expect((await request(app).get('/ready')).status).toBe(503)
    priceStore.set({
      symbol: 'BTC',
      price: 1,
      change24h: 0,
      high24h: 1,
      low24h: 1,
      volume24h: 1,
      updatedAt: 0,
    })
    expect((await request(app).get('/ready')).status).toBe(200)
  })

  it('GET /api/coins lists tracked coins', async () => {
    const res = await request(app).get('/api/coins')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(COINS.length)
  })

  it('GET /api/coins/:symbol is case-insensitive and 404s on unknown', async () => {
    expect((await request(app).get('/api/coins/btc')).body.symbol).toBe('BTC')
    expect((await request(app).get('/api/coins/nope')).status).toBe(404)
  })

  it('rejects bad candle params with 400', async () => {
    expect(
      (await request(app).get('/api/market/candles/BTC?granularity=7')).status,
    ).toBe(400)
    expect((await request(app).get('/api/market/candles/NOPE')).status).toBe(
      400,
    )
  })

  it('unknown route is 404 JSON', async () => {
    const res = await request(app).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Route not found')
  })
})
