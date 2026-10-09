import { hashOrder } from '../order/OrderHasher';
import { Order } from '../types';

describe('OrderHasher', () => {
  const order: Order = {
    maker: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    tokenIn: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH',
    tokenOut: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBI',
    amountIn: 1000n,
    minAmountOut: 900n,
    expiry: 9999999999,
    nonce: 1n,
    keeperFee: 10n,
    preferredDex: null,
  };

  it('produces a 32-byte hash', () => {
    const hash = hashOrder(order);
    expect(hash.length).toBe(32);
  });

  it('produces deterministic hash for same order', () => {
    const hash1 = hashOrder(order);
    const hash2 = hashOrder(order);
    expect(hash1).toEqual(hash2);
  });

  it('produces different hash for different maker', () => {
    const hash1 = hashOrder(order);
    const hash2 = hashOrder({ ...order, maker: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF' });
    expect(hash1).not.toEqual(hash2);
  });

  it('produces different hash for different amount', () => {
    const hash1 = hashOrder(order);
    const hash2 = hashOrder({ ...order, amountIn: 2000n });
    expect(hash1).not.toEqual(hash2);
  });

  it('includes preferredDex in hash when set', () => {
    const hash1 = hashOrder({ ...order, preferredDex: null });
    const hash2 = hashOrder({ ...order, preferredDex: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' });
    expect(hash1).not.toEqual(hash2);
  });
});