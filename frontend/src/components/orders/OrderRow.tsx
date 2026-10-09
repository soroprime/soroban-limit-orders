'use client';

import { TableCell, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CancelButton } from './CancelButton';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderRowProps {
  order: any;
}

export function OrderRow({ order }: OrderRowProps) {
  const tokenIn = order.token_in?.slice(0, 6) + '...';
  const tokenOut = order.token_out?.slice(0, 6) + '...';
  const expiryDate = new Date(order.expiry * 1000).toLocaleDateString();

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{tokenIn}/{tokenOut}</TableCell>
      <TableCell className="capitalize">{order.status?.replace('_', ' ')}</TableCell>
      <TableCell className="font-mono">{parseFloat(order.amount_in || '0').toLocaleString()}</TableCell>
      <TableCell className="font-mono">{order.min_amount_out}</TableCell>
      <TableCell className="font-mono">{order.keeper_fee}</TableCell>
      <TableCell>{expiryDate}</TableCell>
      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
      <TableCell className="text-right">
        {order.status === 'pending' && <CancelButton orderId={order.id} />}
      </TableCell>
    </TableRow>
  );
}