'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { WalletProvider } from '@/providers/WalletProvider';
import { OrderBookProvider } from '@/providers/OrderBookProvider';
import { Toaster } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5000, refetchOnWindowFocus: false },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <OrderBookProvider>
          {children}
          <Toaster />
        </OrderBookProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}