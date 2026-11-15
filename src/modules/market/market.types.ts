export interface Price {
  symbol: string // "BTC"
  price: number // latest trade price in USD
  change24h: number // percent change since 24h open
  high24h: number
  low24h: number
  volume24h: number
  updatedAt: number // ms since epoch
}

export interface Candle {
  time: number // unix seconds, start of the candle
  low: number
  high: number
  open: number
  close: number
  volume: number
}
