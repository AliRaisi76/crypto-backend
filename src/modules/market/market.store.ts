import type { Price } from './market.types.js'

export class PriceStore {
  private prices = new Map<string, Price>()
  private dirty = new Set<string>() // symbols changed since last takeChanges()

  set(price: Price): void {
    this.prices.set(price.symbol, price)
    this.dirty.add(price.symbol)
  }

  get(symbol: string): Price | undefined {
    return this.prices.get(symbol)
  }

  all(): Price[] {
    return [...this.prices.values()]
  }

  // Returns only the prices that changed, then clears the list
  takeChanges(): Price[] {
    const changed = [...this.dirty].flatMap((symbol) => {
      const price = this.prices.get(symbol)
      return price ? [price] : []
    })
    this.dirty.clear()
    return changed
  }
}

// One shared instance for the whole app
export const priceStore = new PriceStore()
