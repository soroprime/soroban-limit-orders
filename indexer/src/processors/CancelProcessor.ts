import axios from 'axios';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'CancelProcessor' });

export interface CancelEvent {
  type: 'cancel';
  orderId: string;
  maker: string;
  nonce: number;
}

export class CancelProcessor {
  constructor(private readonly orderBookUrl: string = config.ORDER_BOOK_URL) {}

  async process(event: CancelEvent): Promise<void> {
    try {
      await axios.post(`${this.orderBookUrl}/internal/orders/${event.orderId}/cancel`, {}, {
        headers: { 'X-API-Key': process.env.ORDERBOOK_API_KEY ?? '' },
      });
      logger.info({ orderId: event.orderId }, 'Processed cancel event');
    } catch (error) {
      logger.warn({ orderId: event.orderId, err: error }, 'Failed to process cancel event');
    }
  }
}