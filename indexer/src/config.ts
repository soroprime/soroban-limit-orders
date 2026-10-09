import { z } from 'zod';

const envSchema = z.object({
  NETWORK: z.enum(['testnet', 'mainnet', 'local']).default('testnet'),
  HORIZON_URL: z.string().url().default('https://horizon-testnet.stellar.org'),
  CONTRACT_ID: z.string().startsWith('C'),
  DATABASE_URL: z.string().default('./indexer.db'),
  INDEXER_START_CURSOR: z.string().default('now'),
  ORDER_BOOK_URL: z.string().url().default('http://localhost:3001'),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
});

export type IndexerConfig = z.infer<typeof envSchema>;

export function loadConfig(): IndexerConfig {
  return envSchema.parse(process.env);
}

export const config = loadConfig();