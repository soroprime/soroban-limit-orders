'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { LimitOrderClient, OrderEvent, OrderWithStatus } from '@soroban-limit-orders/sdk';

interface OrderBookContextType {
  client: LimitOrderClient | null;
  orders: OrderWithStatus[];
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const OrderBookContext = createContext<OrderBookContextType | null>(null);

const ORDER_BOOK_URL = process.env.NEXT_PUBLIC_ORDER_BOOK_URL ?? 'http://localhost:3001';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? '';

export function OrderBookProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<LimitOrderClient | null>(null);
  const [orders, setOrders] = useState<OrderWithStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    const newClient = new LimitOrderClient(ORDER_BOOK_URL, RPC_URL, CONTRACT_ID);
    setClient(newClient);
    await newClient.connectWebSocket();
    
    newClient.subscribeToFeed((event: OrderEvent) => {
      setOrders((prev) => {
        if (event.event === 'order_created' && event.order) {
          return [event.order as OrderWithStatus, ...prev];
        }
        if (event.event === 'order_filled' && event.order_id) {
          return prev.map((o) => (o.id === event.order_id ? { ...o, status: 'filled' as const } : o));
        }
        if (event.event === 'order_cancelled' && event.order_id) {
          return prev.map((o) => (o.id === event.order_id ? { ...o, status: 'cancelled' as const } : o));
        }
        if (event.event === 'order_expired' && event.order_id) {
          return prev.map((o) => (o.id === event.order_id ? { ...o, status: 'expired' as const } : o));
        }
        return prev;
      });
    });

    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    client?.disconnectWebSocket();
    setClient(null);
    setOrders([]);
    setIsConnected(false);
  }, [client]);

  return (
    <OrderBookContext.Provider value={{ client, orders, connect, disconnect, isConnected }}>
      {children}
    </OrderBookContext.Provider>
  );
}

export function useOrderBook() {
  const context = useContext(OrderBookContext);
  if (!context) throw new Error('useOrderBook must be used within OrderBookProvider');
  return context;
}