import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';

export class OrderQueue {
  private queue: OrderWithStatus[] = [];
  private readonly maxSize = 1000;

  enqueue(order: OrderWithStatus): void {
    if (this.queue.some((o) => o.id === order.id)) {
      return;
    }
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    this.queue.push(order);
    this.queue.sort((a, b) => {
      const feeA = BigInt(a.keeper_fee);
      const feeB = BigInt(b.keeper_fee);
      return feeB > feeA ? 1 : feeB < feeA ? -1 : 0;
    });
  }

  dequeue(): OrderWithStatus | undefined {
    return this.queue.shift();
  }

  remove(orderId: string): void {
    this.queue = this.queue.filter((o) => o.id !== orderId);
  }

  size(): number {
    return this.queue.length;
  }

  peek(): OrderWithStatus[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}