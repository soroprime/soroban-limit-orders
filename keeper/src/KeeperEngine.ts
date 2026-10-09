import { OrderQueue } from './OrderQueue';
import { OrderFetcher } from './watcher/OrderFetcher';
import { PriceChecker } from './watcher/PriceChecker';
import { ExpiryPruner } from './watcher/ExpiryPruner';
import { Watcher } from './watcher/Watcher';
import { TxBuilder } from './executor/TxBuilder';
import { TxSubmitter } from './executor/TxSubmitter';
import { ResultParser } from './executor/ResultParser';
import { Executor } from './executor/Executor';
import { Pricer } from './pricer/Pricer';
import { startMetricsServer, stopMetricsServer } from './metrics/MetricsServer';
import { AlertManager } from './alerts/AlertManager';
import { config } from './config';
import pino from 'pino';

const logger = pino({ name: 'KeeperEngine' });

export class KeeperEngine {
  private watcher: Watcher;
  private executor: Executor;
  private started = false;

  constructor() {
    const queue = new OrderQueue();
    const fetcher = new OrderFetcher();
    const pricer = new Pricer();
    const priceChecker = new PriceChecker(pricer);
    const pruner = new ExpiryPruner(queue);

    this.watcher = new Watcher(queue, fetcher, priceChecker, pruner);

    const txBuilder = new TxBuilder();
    const txSubmitter = new TxSubmitter();
    const resultParser = new ResultParser();

    this.executor = new Executor(queue, txBuilder, txSubmitter, resultParser);
  }

  async start(): Promise<void> {
    if (this.started) {
      logger.warn('KeeperEngine already started');
      return;
    }

    logger.info('Starting Keeper Engine');

    await startMetricsServer();

    this.watcher.start();
    this.executor.start();

    this.started = true;

    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));

    logger.info('Keeper Engine started');
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    logger.info('Stopping Keeper Engine...');

    this.watcher.stop();
    this.executor.stop();

    await stopMetricsServer();

    this.started = false;
    logger.info('Keeper Engine stopped');
  }

  private async shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal');
    await this.stop();
    process.exit(0);
  }
}