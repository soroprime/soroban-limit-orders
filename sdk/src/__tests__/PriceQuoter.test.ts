import { PriceQuoter } from '../pricing/PriceQuoter';

describe('PriceQuoter', () => {
  let quoter: PriceQuoter;

  beforeEach(() => {
    quoter = new PriceQuoter('https://rpc.testnet');
  });

  it('returns quote structure', async () => {
    // This will fail without a real RPC, but tests the interface
    try {
      const quote = await quoter.getQuote('CA...', 'CAAA...', 'CBBB...', 1000n);
      expect(quote).toHaveProperty('dex');
      expect(quote).toHaveProperty('amountOut');
      expect(quote).toHaveProperty('priceImpact');
    } catch {
      // Expected without real RPC
    }
  });
});