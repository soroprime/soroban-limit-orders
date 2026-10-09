import axios from 'axios';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'ExpireProcessor' });

export interface ExpireEvent {
  type: 'expire';
  orderId: string;
  maker: string;
  nonce: number;
}

export class ExpireProcessor {
  constructor(private readonly orderBookUrl: string = config.ORDER_BOOK_URL) {}

  async process(event: ExpireEvent): Promise<void> {
    try {
      await axios.post(`${this.orderBookUrl}/internal/orders/${event.orderId}/expire`, {}, {
        headers: { 'X-API-Key': process.env.ORDERBOOK_API_KEY ?? '' },
      });
      logger.info({ orderId: event.orderId }, 'Processed expire event');
    } catch (error) {
      logger.warn({ orderId: event.orderId, err: error }, 'Failed to process expire event');
    }
  }
}