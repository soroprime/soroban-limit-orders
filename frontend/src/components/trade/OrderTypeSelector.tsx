'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useOrderStore } from '@/stores/orderStore';

export function OrderTypeSelector() {
  const { orderType, setOrderType } = useOrderStore();

  return (
    <Tabs value={orderType} onValueChange={setOrderType}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="limit_buy">Limit Buy</TabsTrigger>
        <TabsTrigger value="limit_sell">Limit Sell</TabsTrigger>
        <TabsTrigger value="stop_loss">Stop Loss</TabsTrigger>
        <TabsTrigger value="take_profit">Take Profit</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}