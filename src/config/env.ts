import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  PUSH_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  CANDLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // Fail fast: a misconfigured server should never start
  console.error('Invalid environment:', z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
