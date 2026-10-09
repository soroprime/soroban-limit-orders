'use client';

import { OrderForm } from '@/components/trade/OrderForm';
import { PriceChart } from '@/components/chart/PriceChart';

export default function TradePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold">Place Limit Order</h1>
          <OrderForm />
        </div>
        <div className="space-y-6">
          <PriceChart />
        </div>
      </div>
    </div>
  );
}