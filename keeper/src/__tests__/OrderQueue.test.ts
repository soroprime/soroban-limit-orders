import { OrderQueue } from '../OrderQueue';
import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';

function makeOrder(overrides: Partial<OrderWithStatus> = {}): OrderWithStatus {
  return {
    id: `order-${Date.now()}-${Math.random()}`,
    maker: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    token_in: 'CAAAAA',
    token_out: 'CBBBBB',
    amount_in: '1000',
    min_amount_out: '900',
    expiry: Math.floor(Date.now() / 1000) + 86400,
    nonce: 1,
    keeper_fee: '10',
    preferred_dex: null,
    signature: 'sig',
    status: 'pending',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    fill_tx_hash: null,
    fill_price: null,
    fill_timestamp: null,
    ...overrides,
  };
}

describe('OrderQueue', () => {
  let queue: OrderQueue;

  beforeEach(() => {
    queue = new OrderQueue();
  });

  it('enqueues and dequeues in priority order (highest fee first)', () => {
    const o1 = makeOrder({ id: '1', keeper_fee: '10' });
    const o2 = makeOrder({ id: '2', keeper_fee: '100' });
    const o3 = makeOrder({ id: '3', keeper_fee: '50' });

    queue.enqueue(o1);
    queue.enqueue(o2);
    queue.enqueue(o3);

    expect(queue.dequeue()?.id).toBe('2');
    expect(queue.dequeue()?.id).toBe('3');
    expect(queue.dequeue()?.id).toBe('1');
  });

  it('deduplicates by order id', () => {
    const o1 = makeOrder({ id: '1', keeper_fee: '10' });
    queue.enqueue(o1);
    queue.enqueue(o1);
    expect(queue.size()).toBe(1);
  });

  it('removes order by id', () => {
    const o1 = makeOrder({ id: '1', keeper_fee: '10' });
    queue.enqueue(o1);
    queue.remove('1');
    expect(queue.size()).toBe(0);
    expect(queue.dequeue()).toBeUndefined();
  });

  it('returns size correctly', () => {
    expect(queue.size()).toBe(0);
    queue.enqueue(makeOrder({ id: '1' }));
    expect(queue.size()).toBe(1);
    queue.enqueue(makeOrder({ id: '2' }));
    expect(queue.size()).toBe(2);
  });

  it('peek returns copy of queue', () => {
    queue.enqueue(makeOrder({ id: '1' }));
    const peeked = queue.peek();
    peeked.push(makeOrder({ id: '2' }));
    expect(queue.size()).toBe(1);
  });
});