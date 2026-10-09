export interface Order {
  maker: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
  expiry: number;
  nonce: bigint;
  keeperFee: bigint;
  preferredDex: string | null;
}

export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'expired';

export interface OrderWithStatus extends Order {
  id: string;
  signature: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  fillTxHash: string | null;
  fillPrice: string | null;
  fillTimestamp: number | null;
}

export interface Quote {
  dex: string;
  amountOut: bigint;
  priceImpact: number;
}