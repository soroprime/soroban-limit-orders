import { z } from 'zod';

const envSchema = z.object({
  KEEPER_SECRET_KEY: z.string().startsWith('S'),
  RPC_URL: z.string().url(),
  HORIZON_URL: z.string().url().optional(),
  NETWORK_PASSPHRASE: z.string().default('Test SDF Network ; September 2015'),
  ORDER_BOOK_URL: z.string().url().default('http://localhost:3001'),
  CONTRACT_ID: z.string().startsWith('C'),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  MIN_PROFIT_THRESHOLD: z.coerce.number().default(0.001),
  MAX_CONCURRENT_SETTLEMENTS: z.coerce.number().int().positive().default(3),
  METRICS_PORT: z.coerce.number().int().positive().default(9090),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

export type KeeperConfig = z.infer<typeof envSchema>;

export function loadConfig(): KeeperConfig {
  return envSchema.parse(process.env);
}

export const config = loadConfig();