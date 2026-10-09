'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/providers/WalletProvider';
import { WalletModal } from './WalletModal';

export function ConnectWallet() {
  const { isConnected, publicKey, connect } = useWallet();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && publicKey) {
    return <AccountBadge address={publicKey} />;
  }

  return (
    <Button variant="outline" onClick={() => setShowModal(true)}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}

function AccountBadge({ address }: { address: string }) {
  const { disconnect } = useWallet();
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono">{shortAddress}</span>
      <Button variant="ghost" size="icon" onClick={disconnect}>
        <Wallet className="h-4 w-4" />
      </Button>
    </div>
  );
}