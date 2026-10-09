'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Keypair } from '@stellar/stellar-sdk';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
  signBlob: (blob: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    if (typeof window === 'undefined') return;
    
    // @ts-ignore - Freighter API
    const freighter = window.freighter;
    if (!freighter) {
      throw new Error('Freighter not installed');
    }

    try {
      const pk = await freighter.getPublicKey();
      setPublicKey(pk);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setIsConnected(false);
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    // @ts-ignore
    const freighter = window.freighter;
    if (!freighter) throw new Error('Freighter not installed');
    return freighter.signTransaction(xdr, { network: 'TESTNET' });
  };

  const signBlob = async (blob: string): Promise<string> => {
    // @ts-ignore
    const freighter = window.freighter;
    if (!freighter) throw new Error('Freighter not installed');
    return freighter.signBlob(blob, { network: 'TESTNET' });
  };

  return (
    <WalletContext.Provider value={{ publicKey, isConnected, connect, disconnect, signTransaction, signBlob }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}