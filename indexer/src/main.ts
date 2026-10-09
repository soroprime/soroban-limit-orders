import knex, { Knex } from 'knex';
import { config } from './config';
import { HorizonPoller } from './horizon/HorizonPoller';
import { EventParser } from './horizon/EventParser';
import { CursorStore } from './horizon/CursorStore';
import { FillProcessor } from './processors/FillProcessor';
import { CancelProcessor } from './processors/CancelProcessor';
import { ExpireProcessor } from './processors/ExpireProcessor';
import pino from 'pino';

const logger = pino({ name: 'Indexer' });

async function main(): Promise<void> {
  logger.info({ version: '0.1.0', network: config.NETWORK }, 'Starting Soroban Limit Order Indexer');

  const isSqlite = !config.DATABASE_URL.startsWith('postgresql://') && !config.DATABASE_URL.startsWith('postgres://');
  const db = isSqlite
    ? knex({ client: 'better-sqlite3', connection: { filename: config.DATABASE_URL }, useNullAsDefault: true })
    : knex({ client: 'pg', connection: config.DATABASE_URL });

  const cursorStore = new CursorStore(db);
  const fillProcessor = new FillProcessor();
  const cancelProcessor = new CancelProcessor();
  const expireProcessor = new ExpireProcessor();
  const eventParser = new EventParser(fillProcessor, cancelProcessor, expireProcessor);
  const poller = new HorizonPoller(cursorStore, eventParser);

  await poller.start();

  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    poller.stop();
    await db.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    poller.stop();
    await db.destroy();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Indexer failed to start');
  process.exit(1);
});