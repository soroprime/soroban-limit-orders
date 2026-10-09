import axios from 'axios';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'FillProcessor' });

export interface FillEvent {
  type: 'fill';
  orderId: string;
  maker: string;
  nonce: number;
  amountOut: bigint;
  keeperFee: bigint;
  dex: string;
  txHash: string;
}

export class FillProcessor {
  constructor(private readonly orderBookUrl: string = config.ORDER_BOOK_URL) {}

  async process(event: FillEvent): Promise<void> {
    try {
      const fillPrice = (Number(event.amountOut) / 1_000_000).toFixed(6);
      await axios.post(`${this.orderBookUrl}/internal/orders/${event.orderId}/fill`, {
        txHash: event.txHash,
        fillPrice,
        fillTimestamp: Math.floor(Date.now() / 1000),
      }, {
        headers: { 'X-API-Key': process.env.ORDERBOOK_API_KEY ?? '' },
      });
      logger.info({ orderId: event.orderId, txHash: event.txHash }, 'Processed fill event');
    } catch (error) {
      logger.warn({ orderId: event.orderId, err: error }, 'Failed to process fill event, order may not exist in DB');
    }
  }
}