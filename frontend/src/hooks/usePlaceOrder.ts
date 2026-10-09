'use client';

import { useState } from 'react';
import { toast } from '@/hooks/useToast';
import { useOrderStore } from '@/stores/orderStore';
import { useWallet } from '@/providers/WalletProvider';
import { OrderBuilder, toBaseUnits } from '@soroban-limit-orders/sdk';
import { useOrderBook } from '@/providers/OrderBookProvider';

export function usePlaceOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const { orderType, tokenIn, tokenOut, amount, targetPrice, keeperFee, expiry, nonce } = useOrderStore();
  const { signBlob } = useWallet();
  const { client } = useOrderBook();

  const placeOrder = async () => {
    if (!client) {
      toast({ title: 'Error', description: 'Order book not connected', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const order = new OrderBuilder()
        .maker('') // Will be filled from wallet
        .tokenIn(tokenIn)
        .tokenOut(tokenOut)
        .amountIn(toBaseUnits(amount, 6)) // Assuming 6 decimals for USDC
        .minAmountOut(toBaseUnits((parseFloat(amount) * parseFloat(targetPrice)).toFixed(6), 6))
        .expiry(Math.floor(expiry / 1000))
        .nonce(BigInt(nonce))
        .keeperFee(toBaseUnits((parseFloat(amount) * keeperFee / 100).toFixed(6), 6))
        .preferredDex(null)
        .build();

      // Get maker address from wallet
      // For now, we'll use a placeholder
      const signature = await signBlob('placeholder');
      
      await client.submitOrder(order, signature);
      
      toast({ title: 'Success', description: 'Order placed successfully' });
    } catch (error) {
      console.error('Failed to place order:', error);
      toast({ title: 'Error', description: 'Failed to place order', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return { placeOrder, isLoading };
}