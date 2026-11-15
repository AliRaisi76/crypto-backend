import { describe, it, expect, vi, afterEach } from 'vitest'
import { TtlCache } from '../src/lib/ttl-cache.js'

afterEach(() => {
  vi.useRealTimers()
})

describe('TtlCache', () => {
  it('calls the loader once while the entry is fresh', async () => {
    const cache = new TtlCache<number>(1_000)
    const loader = vi.fn(async () => 42)

    expect(await cache.get('btc', loader)).toBe(42)
    expect(await cache.get('btc', loader)).toBe(42)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('calls the loader again after the TTL expires', async () => {
    vi.useFakeTimers()
    const cache = new TtlCache<number>(1_000)
    const loader = vi.fn(async () => 1)

    await cache.get('btc', loader)
    vi.advanceTimersByTime(1_001)
    await cache.get('btc', loader)

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('keeps separate entries per key', async () => {
    const cache = new TtlCache<string>(1_000)

    expect(await cache.get('btc', async () => 'b')).toBe('b')
    expect(await cache.get('eth', async () => 'e')).toBe('e')
  })
})
