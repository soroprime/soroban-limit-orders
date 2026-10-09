'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/providers/WalletProvider';

export function WalletModal() {
  const { connect } = useWallet();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
      setOpen(false);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Connect your Freighter wallet to use the Soroban Limit Order Protocol.
          </p>
          <Button className="w-full" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect Freighter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}