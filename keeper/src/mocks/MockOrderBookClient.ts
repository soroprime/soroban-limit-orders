import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';

export class MockOrderBookClient {
  private orders: OrderWithStatus[] = [];
  private shouldFail = false;

  setOrders(orders: OrderWithStatus[]): void {
    this.orders = orders;
  }

  setFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  async fetchPending(): Promise<OrderWithStatus[]> {
    if (this.shouldFail) throw new Error('Mock fetch failed');
    return this.orders.filter((o) => o.status === 'pending');
  }
}