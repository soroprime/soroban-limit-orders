'use client';

import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';

interface SubmitButtonProps {
  isLoading: boolean;
  disabled: boolean;
}

export function SubmitButton({ isLoading, disabled }: SubmitButtonProps) {
  const { placeOrder } = usePlaceOrder();

  const handleClick = async () => {
    await placeOrder();
  };

  if (!disabled) {
    return (
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Place Order'
        )}
      </Button>
    );
  }

  return (
    <Button type="button" className="w-full" variant="secondary" disabled>
      Connect Wallet
    </Button>
  );
}