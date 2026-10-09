import { KeeperEngine } from './KeeperEngine';
import { config } from './config';
import pino from 'pino';

const logger = pino({ name: 'Keeper' });

async function main(): Promise<void> {
  logger.info({ version: '0.1.0', network: config.NETWORK_PASSPHRASE }, 'Starting Soroban Limit Order Keeper');

  const engine = new KeeperEngine();
  await engine.start();
}

main().catch((err) => {
  logger.error({ err }, 'Keeper failed to start');
  process.exit(1);
});