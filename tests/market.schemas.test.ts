import { describe, it, expect } from 'vitest'
import {
  candlesQuerySchema,
  symbolSchema,
} from '../src/modules/market/market.schemas.js'

describe('candlesQuerySchema', () => {
  it('defaults granularity to 3600 when missing', () => {
    const result = candlesQuerySchema.parse({})
    expect(result.granularity).toBe(3600)
  })

  it('accepts an allowed granularity given as a string', () => {
    const result = candlesQuerySchema.parse({ granularity: '300' })
    expect(result.granularity).toBe(300)
  })

  it('rejects a granularity that is not in the list', () => {
    const result = candlesQuerySchema.safeParse({ granularity: '7' })
    expect(result.success).toBe(false)
  })
})

describe('symbolSchema', () => {
  it('trims and uppercases a valid symbol', () => {
    expect(symbolSchema.parse('  btc ')).toBe('BTC')
  })

  it('rejects an unknown coin', () => {
    expect(symbolSchema.safeParse('NOPE').success).toBe(false)
  })
})
