export interface CoinInfo {
  symbol: string // matches the Coinbase product "BTC-USD"
  name: string
}

export const COINS: readonly CoinInfo[] = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'AAA', name: 'Test' },
]

export const isKnownSymbol = (symbol: string) =>
  COINS.some((c) => c.symbol === symbol)
