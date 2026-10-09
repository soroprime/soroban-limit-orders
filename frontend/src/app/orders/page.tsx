'use client';

import { useOrderBook } from '@/providers/OrderBookProvider';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function OrdersPage() {
  const { orders, isConnected } = useOrderBook();

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Card>
          <CardContent className="py-12">
            <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground mb-4">Please connect your wallet to view your orders.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Open Orders</h1>
          <p className="text-muted-foreground">{orders.length} orders</p>
        </div>
      </div>
      <Card>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}