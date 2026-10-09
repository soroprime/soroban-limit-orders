import { SoroswapPricer } from './adapters/SoroswapPricer';
import { PhoenixPricer } from './adapters/PhoenixPricer';
import { AquariusPricer } from './adapters/AquariusPricer';
import { PriceCache } from './cache/PriceCache';
import pino from 'pino';

const logger = pino({ name: 'Pricer' });

export interface QuoteResult {
  bestQuote: bigint;
  bestDex: string;
  allQuotes: Record<string, bigint>;
}

export class Pricer {
  private soroswap = new SoroswapPricer();
  private phoenix = new PhoenixPricer();
  private aquarius = new AquariusPricer();
  private cache = new PriceCache();

  async getBestQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<QuoteResult> {
    const cacheKey = `${tokenIn}:${tokenOut}:${amountIn}`;

    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      return {
        bestQuote: cached,
        bestDex: 'cached',
        allQuotes: { cached },
      };
    }

    const [soroswapResult, phoenixResult, aquariusResult] = await Promise.allSettled([
      this.soroswap.getQuote(tokenIn, tokenOut, amountIn),
      this.phoenix.getQuote(tokenIn, tokenOut, amountIn),
      this.aquarius.getQuote(tokenIn, tokenOut, amountIn),
    ]);

    const quotes: Record<string, bigint> = {
      soroswap: soroswapResult.status === 'fulfilled' ? soroswapResult.value : 0n,
      phoenix: phoenixResult.status === 'fulfilled' ? phoenixResult.value : 0n,
      aquarius: aquariusResult.status === 'fulfilled' ? aquariusResult.value : 0n,
    };

    const validQuotes = Object.entries(quotes).filter(([, v]) => v > 0n);
    if (validQuotes.length === 0) {
      logger.warn({ tokenIn, tokenOut, amountIn: amountIn.toString() }, 'No valid quotes from any DEX');
      return { bestQuote: 0n, bestDex: '', allQuotes: quotes };
    }

    const [bestDex, bestQuote] = validQuotes.reduce((a, b) => (a[1] > b[1] ? a : b));
    const spread = bestQuote - validQuotes.reduce((a, b) => (a[1] < b[1] ? a : b))[1];

    logger.info(
      { tokenIn, tokenOut, bestDex, bestQuote: bestQuote.toString(), spread: spread.toString() },
      'Selected best quote'
    );

    this.cache.set(cacheKey, bestQuote);

    return { bestQuote, bestDex, allQuotes: quotes };
  }

  clearCache(): void {
    this.cache.clear();
  }
}