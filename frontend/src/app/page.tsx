'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-4">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Soroban Limit Orders</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/trade" className="text-sm font-medium hover:text-primary transition-colors">
              Trade
            </Link>
            <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
              Orders
            </Link>
            <ConnectWallet />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
          Decentralized Limit Orders on <span className="text-primary">Soroban</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
          Place limit, stop-loss, and take-profit orders for any Stellar asset. 
          Trustless execution via smart contracts with multi-DEX routing for best prices.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/trade">
            <Button size="lg" className="gap-2">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            View Docs
          </Button>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3 max-w-4xl">
          <div className="rounded-lg border bg-card p-6">
            <Zap className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Instant Settlement</h3>
            <p className="text-muted-foreground">Orders execute atomically on-chain with no counterparty risk.</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Shield className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Multi-DEX Routing</h3>
            <p className="text-muted-foreground">Automatically routes through Soroswap, Phoenix, and Aquarius for best price.</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Globe className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Trustless & Permissionless</h3>
            <p className="text-muted-foreground">No custody, no KYC. Your keys, your orders, your control.</p>
          </div>
        </div>
      </div>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>Built on Soroban &bull; Open Source &bull; <a href="https://github.com" className="hover:text-primary">GitHub</a></p>
      </footer>
    </main>
  );
}