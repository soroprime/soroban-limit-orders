'use client';

import { Badge } from '@/components/ui/Badge';

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'default',
    filled: 'secondary',
    cancelled: 'destructive',
    expired: 'outline',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    filled: 'Filled',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };

  return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
}