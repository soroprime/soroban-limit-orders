import { QuoteResult } from '../pricer/Pricer';

export class MockPricer {
  private quotes = new Map<string, QuoteResult>();
  private defaultQuote: QuoteResult = {
    bestQuote: 1000n,
    bestDex: 'mock',
    allQuotes: { mock: 1000n },
  };
  private callCount = 0;

  setQuote(tokenIn: string, tokenOut: string, amountIn: bigint, quote: QuoteResult): void {
    this.quotes.set(`${tokenIn}:${tokenOut}:${amountIn}`, quote);
  }

  setDefaultQuote(quote: QuoteResult): void {
    this.defaultQuote = quote;
  }

  getCallCount(): number {
    return this.callCount;
  }

  async getBestQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<QuoteResult> {
    this.callCount++;
    const key = `${tokenIn}:${tokenOut}:${amountIn}`;
    return this.quotes.get(key) ?? this.defaultQuote;
  }

  clearCache(): void {
    // No-op for mock
  }
}