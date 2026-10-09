import axios, { AxiosInstance } from 'axios';
import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'OrderFetcher' });

export class OrderFetcher {
  private client: AxiosInstance;

  constructor(baseUrl: string = config.ORDER_BOOK_URL) {
    this.client = axios.create({
      baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async fetchAllPending(): Promise<OrderWithStatus[]> {
    const allOrders: OrderWithStatus[] = [];
    const limit = 100;
    let offset = 0;

    while (true) {
      try {
        const response = await this.client.get('/orders', {
          params: { status: 'pending', limit, offset },
        });

        const orders = response.data.orders as OrderWithStatus[];
        if (orders.length === 0) break;

        allOrders.push(...orders);
        if (orders.length < limit) break;
        offset += limit;
      } catch (error) {
        logger.error({ err: error, offset }, 'Failed to fetch orders');
        throw error;
      }
    }

    logger.debug({ count: allOrders.length }, 'Fetched pending orders');
    return allOrders;
  }
}