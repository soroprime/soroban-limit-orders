import { OrderQueue } from '../OrderQueue';

export class ExpiryPruner {
  constructor(private readonly queue: OrderQueue) {}

  prune(): number {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const orders = this.queue.peek();
    let pruned = 0;

    for (const order of orders) {
      if (BigInt(order.expiry) < now) {
        this.queue.remove(order.id);
        pruned++;
      }
    }

    return pruned;
  }
}