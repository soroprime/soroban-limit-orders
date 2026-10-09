import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';
import { Pricer } from '../pricer/Pricer';

export interface FillabilityResult {
  fillable: boolean;
  expectedOut: bigint;
  bestDex: string;
  allQuotes: Record<string, bigint>;
}

export class PriceChecker {
  constructor(private readonly pricer: Pricer) {}

  async isFillable(order: OrderWithStatus): Promise<FillabilityResult> {
    const swapAmount = BigInt(order.amount_in) - BigInt(order.keeper_fee);
    if (swapAmount <= 0n) {
      return { fillable: false, expectedOut: 0n, bestDex: '', allQuotes: {} };
    }

    const quote = await this.pricer.getBestQuote(
      order.token_in,
      order.token_out,
      swapAmount
    );

    const fillable = quote.bestQuote >= BigInt(order.min_amount_out);

    return {
      fillable,
      expectedOut: quote.bestQuote,
      bestDex: quote.bestDex,
      allQuotes: quote.allQuotes,
    };
  }
}