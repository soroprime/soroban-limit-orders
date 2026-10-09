import { OrderQueue } from '../OrderQueue';
import { TxBuilder, PreparedTx } from './TxBuilder';
import { TxSubmitter, SubmitResult } from './TxSubmitter';
import { ResultParser, SettlementResult } from './ResultParser';
import { config } from '../config';
import { metrics } from '../metrics/MetricsServer';
import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'Executor' });

export class Executor {
  private running = false;
  private activeSettlements = 0;

  constructor(
    private readonly queue: OrderQueue,
    private readonly txBuilder: TxBuilder,
    private readonly txSubmitter: TxSubmitter,
    private readonly resultParser: ResultParser,
    private readonly maxConcurrent: number = config.MAX_CONCURRENT_SETTLEMENTS,
    private readonly orderBookUrl: string = config.ORDER_BOOK_URL
  ) {}

  start(): void {
    this.running = true;
    this.processQueue();
  }

  stop(): void {
    this.running = false;
  }

  private async processQueue(): Promise<void> {
    while (this.running) {
      if (this.activeSettlements >= this.maxConcurrent) {
        await this.sleep(1000);
        continue;
      }

      const order = this.queue.dequeue();
      if (!order) {
        await this.sleep(5000);
        continue;
      }

      this.activeSettlements++;
      this.settleOrder(order).finally(() => {
        this.activeSettlements--;
      });
    }
  }

  private async settleOrder(order: any): Promise<void> {
    const orderId = order.id;
    metrics.increment('orders_attempted_total');

    try {
      const dexAddress = order.preferred_dex ?? 'CA...'; // TODO: determine best DEX
      const { tx } = await this.txBuilder.buildSettleTx(order, dexAddress);
      const submitResult = await this.txSubmitter.submit(tx);

      if (!submitResult.success) {
        logger.warn({ orderId, error: submitResult.error }, 'Settlement failed, re-queueing');
        metrics.increment('orders_failed_total');
        this.requeueWithBackoff(order);
        return;
      }

      const parsed = this.resultParser.parse(submitResult.resultXdr!);
      logger.info({ orderId, amountOut: parsed.amountOut.toString(), dex: parsed.dexUsed }, 'Order settled');

      await this.removeOrderFromBook(orderId);
      metrics.increment('orders_filled_total');
    } catch (error) {
      logger.error({ orderId, err: error }, 'Settlement error, re-queueing');
      metrics.increment('orders_failed_total');
      this.requeueWithBackoff(order);
    }
  }

  private async removeOrderFromBook(orderId: string): Promise<void> {
    try {
      await axios.delete(`${this.orderBookUrl}/orders/${orderId}`, {
        headers: { 'X-API-Key': process.env.ORDERBOOK_API_KEY ?? '' },
      });
    } catch (error) {
      logger.warn({ orderId, err: error }, 'Failed to remove order from orderbook');
    }
  }

  private requeueWithBackoff(order: any): void {
    setTimeout(() => this.queue.enqueue(order), 30000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}