'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@radix-ui/react-dialog';
import { useWallet } from '@/providers/WalletProvider';
import { useOrderBook } from '@/providers/OrderBookProvider';
import { toast } from '@/hooks/useToast';

interface CancelButtonProps {
  orderId: string;
}

export function CancelButton({ orderId }: CancelButtonProps) {
  const { signBlob } = useWallet();
  const { client } = useOrderBook();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      // In a real implementation, we'd sign a cancellation payload
      const signature = await signBlob('cancel-' + orderId);
      await client.cancelOrder(orderId, signature);
      toast({ title: 'Success', description: 'Order cancelled' });
    } catch (error) {
      console.error('Failed to cancel:', error);
      toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this order? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Order</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={loading}>
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}