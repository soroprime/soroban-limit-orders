import { calculatePriceImpact, calculateMinAmountOut } from '../pricing/ImpactCalculator';

export { calculatePriceImpact, calculateMinAmountOut };

export function priceToMinAmountOut(price: bigint, amountIn: bigint, slippageBps: number): bigint {
  return calculateMinAmountOut(amountIn, price, slippageBps);
}

export function minAmountOutToPrice(minAmountOut: bigint, amountIn: bigint): bigint {
  return (minAmountOut * 1_000_000n) / amountIn;
}