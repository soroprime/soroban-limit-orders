'use client';

import { useOrderStore, TOKENS } from '@/stores/orderStore';

export function OrderPreview() {
  const { orderType, tokenIn, tokenOut, amount, targetPrice, keeperFee } = useOrderStore();

  const tokenInInfo = TOKENS.find((t) => t.address === tokenIn);
  const tokenOutInfo = TOKENS.find((t) => t.address === tokenOut);

  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(targetPrice) || 0;
  const keeperFeeNum = keeperFee / 100;
  const estimatedOut = amountNum * priceNum;
  const keeperFeeAmount = amountNum * keeperFeeNum;
  const netAmount = amountNum - keeperFeeAmount;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="font-medium">Order Preview</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-muted-foreground">Type</span>
        <span className="text-right capitalize">{orderType.replace('_', ' ')}</span>
        
        <span className="text-muted-foreground">Pair</span>
        <span className="text-right font-mono">
          {tokenInInfo?.symbol} / {tokenOutInfo?.symbol}
        </span>

        <span className="text-muted-foreground">Amount In</span>
        <span className="text-right font-mono">{amountNum.toLocaleString()} {tokenInInfo?.symbol}</span>

        <span className="text-muted-foreground">Est. Amount Out</span>
        <span className="text-right font-mono">{estimatedOut.toLocaleString()} {tokenOutInfo?.symbol}</span>

        <span className="text-muted-foreground">Keeper Fee</span>
        <span className="text-right font-mono">{keeperFeeAmount.toLocaleString()} {tokenInInfo?.symbol}</span>

        <span className="text-muted-foreground">Net to Swap</span>
        <span className="text-right font-mono">{netAmount.toLocaleString()} {tokenInInfo?.symbol}</span>
      </div>
    </div>
  );
}