'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { OrderTypeSelector } from './OrderTypeSelector';
import { OrderPreview } from './OrderPreview';
import { SubmitButton } from './SubmitButton';
import { useOrderStore, TOKENS } from '@/stores/orderStore';
import { useWallet } from '@/providers/WalletProvider';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';

export function OrderForm() {
  const { orderType, tokenIn, tokenOut, amount, targetPrice, keeperFee, expiry, setTokenIn, setTokenOut, setAmount, setTargetPrice, setKeeperFee, setExpiry } = useOrderStore();
  const { isConnected, publicKey } = useWallet();
  const { placeOrder, isLoading } = usePlaceOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await placeOrder();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <OrderTypeSelector />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Token In</label>
            <Select value={tokenIn} onValueChange={setTokenIn}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.map((t) => (
                  <SelectItem key={t.address} value={t.address}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Token Out</label>
            <Select value={tokenOut} onValueChange={setTokenOut}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.map((t) => (
                  <SelectItem key={t.address} value={t.address}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={!isConnected}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Price</label>
          <Input
            type="number"
            step="0.000001"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="Enter target price"
            disabled={!isConnected}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Keeper Fee (%)</label>
          <Input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={keeperFee}
            onChange={(e) => setKeeperFee(parseFloat(e.target.value))}
            disabled={!isConnected}
          />
          <span className="text-sm text-muted-foreground">{keeperFee}%</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Expiry</label>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger>
              <SelectValue placeholder="Select expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Date.now() + 3600 * 1000}>1 hour</SelectItem>
              <SelectItem value={Date.now() + 14400 * 1000}>4 hours</SelectItem>
              <SelectItem value={Date.now() + 86400 * 1000}>24 hours</SelectItem>
              <SelectItem value={Date.now() + 604800 * 1000}>7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <OrderPreview />
      <SubmitButton isLoading={isLoading} disabled={!isConnected} />
    </form>
  );
}