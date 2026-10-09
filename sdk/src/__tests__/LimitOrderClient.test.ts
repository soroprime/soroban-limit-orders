import { LimitOrderClient } from '../client/LimitOrderClient';
import { Order } from '../types';

describe('LimitOrderClient', () => {
  let client: LimitOrderClient;
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    global.fetch = mockFetch;
    client = new LimitOrderClient('http://localhost:3001', 'https://rpc.testnet', 'CA...');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls submitOrder with correct params', async () => {
    const order: Order = {
      maker: 'GAAA...',
      tokenIn: 'CAAA...',
      tokenOut: 'CBBB...',
      amountIn: 1000n,
      minAmountOut: 900n,
      expiry: 9999999999,
      nonce: 1n,
      keeperFee: 10n,
      preferredDex: null,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'order-123', order: { ...order, id: 'order-123', status: 'pending' } }),
    });

    const result = await client.submitOrder(order, 'signature123');
    expect(result.id).toBe('order-123');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/orders', expect.any(Object));
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid signature' }),
    });

    const order: Order = {
      maker: 'GAAA...',
      tokenIn: 'CAAA...',
      tokenOut: 'CBBB...',
      amountIn: 1000n,
      minAmountOut: 900n,
      expiry: 9999999999,
      nonce: 1n,
      keeperFee: 10n,
      preferredDex: null,
    };

    await expect(client.submitOrder(order, 'bad')).rejects.toThrow();
  });
});