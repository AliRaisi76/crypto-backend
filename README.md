# crypto-backend-verify

Express + Socket.IO backend that streams live crypto prices from KuCoin.

## Requirements

- Node.js 20+ (uses built-in `fetch`)
- Internet access to `api.kucoin.com`

## Setup

```bash
npm install
cp .env.example .env   # optional; defaults work without it
npm run dev
```

The server starts on `http://localhost:4000` (or `PORT`).

## Configuration

All variables are optional. See `.env.example` for descriptions.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `4000` | HTTP and Socket.IO port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin |
| `LOG_LEVEL` | `info` | Pino log level |
| `PUSH_INTERVAL_MS` | `1000` | Interval for batched `prices:update` events |
| `CANDLE_TTL_MS` | `60000` | Candle cache lifetime |

Invalid values stop the server at startup with a clear error.

## Coins

Configured in `src/config/coins.ts`: BTC, ETH, SOL, XRP, ADA, DOGE, LTC, LINK. Each is traded against USDT on KuCoin.

## HTTP API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness check. Returns `{ status, uptime }`. |
| GET | `/ready` | Readiness check. 200 once prices have loaded, otherwise 503. |
| GET | `/api/coins` | All coins with their latest price (`live`). |
| GET | `/api/coins/:symbol` | One coin. 404 if the symbol is unknown. |
| GET | `/api/market/prices` | Latest price snapshot for every coin. |
| GET | `/api/market/candles/:symbol?granularity=3600` | OHLCV candles, oldest first. |

### Candle granularity

`granularity` is in seconds and must be one of:

`60` (1m), `300` (5m), `900` (15m), `3600` (1h), `21600` (6h), `86400` (1d).

Default is `3600`. Any other value returns 400.

### Example

```bash
curl "http://localhost:4000/api/market/candles/BTC?granularity=3600"
```

```json
{
  "symbol": "BTC",
  "granularity": 3600,
  "candles": [
    { "time": 1794398400, "open": 73985.5, "close": 73886.9, "high": 74072.6, "low": 73832.8, "volume": 97.3 }
  ]
}
```

## Realtime (Socket.IO)

Connect to `http://localhost:4000` with a Socket.IO client.

| Event | Direction | Payload |
| --- | --- | --- |
| `prices:snapshot` | server → client | All coins, sent once on connect |
| `prices:update` | server → client | Only the coins that changed since the last push, sent every `PUSH_INTERVAL_MS` |

Test it with the included script while the server is running:

```bash
node scripts/test-socket.mjs
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with auto-restart on file changes |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run Vitest tests in `tests/` |
| `npm run typecheck` | TypeScript check without emitting files |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Project layout

```
src/
  app.ts                 Express app setup (middleware, routes, error handling)
  server.ts              HTTP server, feed, Socket.IO, graceful shutdown
  config/                Env validation and coin list
  lib/                   Errors, logger, TTL cache
  middlewares/           Error handler
  modules/
    coins/               /api/coins
    health/              /health, /ready
    market/              Feed from KuCoin, price store, candles, routes
    realtime/            Socket.IO gateway
tests/                   Vitest tests
scripts/test-socket.mjs  Manual Socket.IO client check
```

## Notes

- The market feed opens a KuCoin WebSocket on startup. It fetches a fresh token for each connection and reconnects with exponential backoff (1s to 30s).
- Prices are kept in memory. Restarting the server clears them until the feed reconnects.
