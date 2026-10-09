import { Pricer } from '../pricer/Pricer';
import { MockPricer } from '../mocks/MockPricer';

describe('Pricer', () => {
  let pricer: Pricer;

  beforeEach(() => {
    pricer = new Pricer();
  });

  it('selects best quote from multiple DEXes', async () => {
    const result = await pricer.getBestQuote('CA', 'CB', 1000n);
    expect(result.bestQuote).toBeGreaterThanOrEqual(0n);
  });

  it('returns all quotes', async () => {
    const result = await pricer.getBestQuote('CA', 'CB', 1000n);
    expect(result.allQuotes).toHaveProperty('soroswap');
    expect(result.allQuotes).toHaveProperty('phoenix');
    expect(result.allQuotes).toHaveProperty('aquarius');
  });

  it('handles zero quotes gracefully', async () => {
    const result = await pricer.getBestQuote('UNKNOWN', 'TOKEN', 1000n);
    expect(result.bestQuote).toBe(0n);
  });
});

describe('MockPricer', () => {
  let mockPricer: MockPricer;

  beforeEach(() => {
    mockPricer = new MockPricer();
  });

  it('returns configured quote', async () => {
    mockPricer.setQuote('CA', 'CB', 1000n, {
      bestQuote: 2000n,
      bestDex: 'phoenix',
      allQuotes: { phoenix: 2000n, soroswap: 1500n, aquarius: 1800n },
    });

    const result = await mockPricer.getBestQuote('CA', 'CB', 1000n);
    expect(result.bestQuote).toBe(2000n);
    expect(result.bestDex).toBe('phoenix');
  });

  it('uses default quote when not configured', async () => {
    const result = await mockPricer.getBestQuote('CA', 'CB', 1000n);
    expect(result.bestQuote).toBe(1000n);
  });

  it('tracks call count for cache verification', async () => {
    await mockPricer.getBestQuote('CA', 'CB', 1000n);
    await mockPricer.getBestQuote('CA', 'CB', 1000n);
    expect(mockPricer.getCallCount()).toBe(2);
  });
});