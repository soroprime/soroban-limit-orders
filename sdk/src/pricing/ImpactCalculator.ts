export function calculatePriceImpact(spotPrice: bigint, effectivePrice: bigint): number {
  if (spotPrice === 0n) return 0;
  const diff = effectivePrice > spotPrice ? effectivePrice - spotPrice : spotPrice - effectivePrice;
  return Number((diff * 10000n) / spotPrice) / 100; // Return as percentage with 2 decimal places
}

export function calculateMinAmountOut(amountIn: bigint, targetPrice: bigint, slippageBps: number): bigint {
  // targetPrice is in base units (e.g., 1_000_000 = 1.0 for 6 decimals)
  // slippageBps is in basis points (100 = 1%)
  const minPrice = targetPrice - (targetPrice * BigInt(slippageBps)) / 10000n;
  return (amountIn * minPrice) / 1_000_000n;
}