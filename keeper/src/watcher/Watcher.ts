import { OrderFetcher } from './OrderFetcher';
import { PriceChecker, FillabilityResult } from './PriceChecker';
import { ExpiryPruner } from './ExpiryPruner';
import { OrderQueue } from '../OrderQueue';
import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';
import { config } from '../config';
import { metrics } from '../metrics/MetricsServer';
import pino from 'pino';

const logger = pino({ name: 'Watcher' });

export class Watcher {
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly queue: OrderQueue,
    private readonly fetcher: OrderFetcher,
    private readonly priceChecker: PriceChecker,
    private readonly pruner: ExpiryPruner,
    private readonly pollIntervalMs: number = config.POLL_INTERVAL_MS
  ) {}

  start(): void {
    logger.info({ intervalMs: this.pollIntervalMs }, 'Starting watcher');
    this.tick();
    this.interval = setInterval(() => this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    logger.info('Watcher stopped');
  }

  private async tick(): Promise<void> {
    try {
      const pruned = this.pruner.prune();
      if (pruned > 0) {
        logger.info({ pruned }, 'Pruned expired orders from queue');
        metrics.increment('orders_expired_total', pruned);
      }

      const orders = await this.fetcher.fetchAllPending();
      metrics.increment('orders_fetched_total', orders.length);

      for (const order of orders) {
        const result = await this.priceChecker.isFillable(order);
        if (result.fillable) {
          this.queue.enqueue(order);
          metrics.increment('orders_enqueued_total');
          logger.debug(
            { orderId: order.id, bestDex: result.bestDex, expectedOut: result.expectedOut.toString() },
            'Order enqueued for settlement'
          );
        }
      }

      metrics.gauge('queue_depth', this.queue.size());
    } catch (error) {
      logger.error({ err: error }, 'Watcher tick failed');
    }
  }
}