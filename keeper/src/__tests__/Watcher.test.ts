import { Watcher } from '../watcher/Watcher';
import { OrderQueue } from '../OrderQueue';
import { OrderFetcher } from '../watcher/OrderFetcher';
import { PriceChecker } from '../watcher/PriceChecker';
import { ExpiryPruner } from '../watcher/ExpiryPruner';
import { MockOrderBookClient } from '../mocks/MockOrderBookClient';
import { MockPricer } from '../mocks/MockPricer';
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

describe('Watcher', () => {
  let queue: OrderQueue;
  let mockFetcher: MockOrderBookClient;
  let mockPricer: MockPricer;
  let watcher: Watcher;

  beforeEach(() => {
    queue = new OrderQueue();
    mockFetcher = new MockOrderBookClient();
    mockPricer = new MockPricer();

    // Mock the fetcher's fetchAllPending method
    jest.spyOn(mockFetcher, 'fetchAllPending').mockImplementation(async () => mockFetcher.fetchPending());

    const priceChecker = new PriceChecker(mockPricer as any);
    const pruner = new ExpiryPruner(queue);

    watcher = new Watcher(queue, mockFetcher as any, priceChecker, pruner, 100);
  });

  afterEach(async () => {
    watcher.stop();
    await new Promise((r) => setTimeout(r, 150));
  });

  it('fetches orders and enqueues fillable ones', async () => {
    const order = makeOrder({ id: '1', keeper_fee: '50' });
    mockFetcher.setOrders([order]);
    mockPricer.setDefaultQuote({ bestQuote: 950n, bestDex: 'mock', allQuotes: { mock: 950n } });

    await (watcher as any).tick();
    await new Promise((r) => setTimeout(r, 50));

    expect(queue.size()).toBe(1);
    expect(queue.peek()[0].id).toBe('1');
  });

  it('does not enqueue orders below min_amount_out', async () => {
    const order = makeOrder({ id: '1', min_amount_out: '2000' });
    mockFetcher.setOrders([order]);
    mockPricer.setDefaultQuote({ bestQuote: 1000n, bestDex: 'mock', allQuotes: { mock: 1000n } });

    await (watcher as any).tick();
    await new Promise((r) => setTimeout(r, 50));

    expect(queue.size()).toBe(0);
  });

  it('prunes expired orders from queue', async () => {
    const order = makeOrder({ id: '1', expiry: Math.floor(Date.now() / 1000) - 1 });
    queue.enqueue(order);

    await (watcher as any).tick();

    expect(queue.size()).toBe(0);
  });
});