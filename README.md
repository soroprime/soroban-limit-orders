# Soroban Limit Order Protocol

A decentralized limit order protocol built on [Soroban](https://soroban.stellar.org/) (Stellar's smart contract platform). Place limit orders, stop-losses, and take-profit orders on any Soroban-based DEX — without custodying your funds.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Soroban](https://img.shields.io/badge/Soroban-v21-blueviolet)](https://soroban.stellar.org/)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Order Types](#order-types)
- [Smart Contract](#smart-contract)
  - [Order Struct](#order-struct)
  - [Contract Methods](#contract-methods)
- [Keeper Network](#keeper-network)
- [Off-Chain Order Book](#off-chain-order-book)
- [TypeScript SDK](#typescript-sdk)
- [Frontend](#frontend)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Deployment](#deployment)
  - [Deploy the Contract](#deploy-the-contract)
  - [Run the Keeper Bot](#run-the-keeper-bot)
  - [Deploy the Frontend](#deploy-the-frontend)
- [Security](#security)
  - [Threat Model](#threat-model)
  - [Known Risks & Mitigations](#known-risks--mitigations)
  - [Audit Status](#audit-status)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Soroban DEXes (Soroswap, Phoenix, Aquarius) only support market orders out of the box. This protocol adds a permissionless limit order layer on top of them, enabling traders to:

- **Buy** a token when its price drops to a target
- **Sell** a token when its price rises to a target
- **Stop out** of a position automatically when price falls below a threshold
- **Take profit** automatically when price hits a target

Orders are signed off-chain by the user, stored in a lightweight order book service, and settled on-chain by a decentralized network of **keeper bots** that earn a fee tip for each successful execution.

No custody. No trust assumptions beyond the smart contract. Anyone can run a keeper.

---

## How It Works

```
1. User signs an order (off-chain, gasless)
         │
         ▼
2. Order submitted to the Order Book Service
         │
         ▼
3. Keeper bots poll for pending orders
         │
         ▼
4. Keeper checks current DEX price via RPC simulation
         │
         ├── Price condition NOT met → skip, retry later
         │
         └── Price condition MET
                   │
                   ▼
         5. Keeper calls Settlement Contract on-chain
                   │
                   ▼
         6. Contract verifies:
            - Valid user signature
            - Order not expired
            - Order not already filled/cancelled
            - min_amount_out satisfied by current DEX quote
                   │
                   ▼
         7. Contract executes swap via DEX
                   │
                   ▼
         8. Output tokens sent to user
            Keeper fee sent to keeper
```

The settlement contract is **stateless for orders** — it does not store the full order book on-chain (which would be expensive in ledger entries). It only stores filled/cancelled order nonces to prevent replay attacks.

---

## Features

- **Non-custodial** — users keep funds in their own wallet until execution
- **Permissionless keepers** — anyone can run a keeper bot and earn fees
- **Multiple order types** — limit buy, limit sell, stop-loss, take-profit
- **Multi-DEX routing** — executes on whichever DEX offers the best price at settlement time
- **Order expiry** — all orders have a mandatory expiry timestamp enforced on-chain
- **Replay protection** — nonce-based cancellation and fill tracking on-chain
- **Slippage protection** — `min_amount_out` enforced at the contract level
- **Keeper fee tips** — configurable per order to incentivize fast execution
- **TypeScript SDK** — easy integration for dApps and bots
- **REST API** — order book service with OpenAPI spec

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│      Place · Cancel · View Orders · LP Dashboard            │
└────────────────────────┬────────────────────────────────────┘
                         │  REST / SDK
┌────────────────────────▼────────────────────────────────────┐
│               Order Book Service (Node.js)                  │
│   - Stores signed pending orders (SQLite / PostgreSQL)      │
│   - REST API for order submission, cancellation, queries    │
│   - WebSocket feed for real-time order updates              │
└───────┬──────────────────────────────┬──────────────────────┘
        │ Poll pending orders          │ Price feeds
┌───────▼───────┐              ┌───────▼──────────────────────┐
│  Keeper Bot   │              │   Stellar RPC / Horizon API  │
│  (TypeScript) │              │   Soroswap / Phoenix quotes  │
└───────┬───────┘              └──────────────────────────────┘
        │ settle(order, signature)
┌───────▼──────────────────────────────────────────────────────┐
│              Soroban Settlement Contract (Rust)              │
│                                                              │
│  verify_signature()   →  verify order was signed by maker   │
│  check_expiry()       →  reject expired orders              │
│  check_nonce()        →  reject replayed / cancelled orders │
│  simulate_swap()      →  verify min_amount_out is met       │
│  execute_swap()       →  call DEX contract                  │
│  distribute_funds()   →  send output to maker, fee to keeper│
└──────────────────────────────────────────────────────────────┘
```

---

## Project Structure

The repository is a monorepo organized into six primary workspaces — `contracts`, `keeper`, `orderbook`, `sdk`, `frontend`, and `indexer` — plus shared infrastructure, tooling, and documentation.

```
soroban-limit-orders/
│
│  ── Workspace root ──────────────────────────────────────────
├── package.json                  # NPM workspaces root
├── pnpm-workspace.yaml           # pnpm workspace definition
├── turbo.json                    # Turborepo pipeline config
├── .env.example                  # All environment variables documented
├── .env.test                     # Test environment overrides
├── docker-compose.yml            # Full local stack
├── docker-compose.test.yml       # Isolated test stack
├── Makefile                      # Top-level dev shortcuts
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # Run tests on every PR
│   │   ├── deploy-testnet.yml    # Auto-deploy to testnet on merge to main
│   │   ├── deploy-mainnet.yml    # Manual-trigger mainnet deploy
│   │   ├── audit.yml             # cargo audit + npm audit on schedule
│   │   └── release.yml           # Publish SDK to NPM on tag
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── dependabot.yml
├── .husky/
│   ├── pre-commit                # lint-staged hook
│   └── commit-msg                # Conventional commits enforcement
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
└── LICENSE
│
│  ── contracts/ ─────────────────────────────────────────────
│  All Soroban smart contracts (Rust). Each contract is an
│  independent crate compiled to wasm32-unknown-unknown.
│
├── contracts/
│   │
│   ├── Cargo.toml                # Workspace Cargo manifest
│   ├── Cargo.lock
│   ├── rust-toolchain.toml       # Pinned Rust toolchain version
│   │
│   ├── limit_order/              # Core settlement contract
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs            # Contract entry points & #[contractimpl]
│   │       ├── order.rs          # Order struct, OrderType enum, hash fn
│   │       ├── settlement.rs     # settle(), simulate_settlement()
│   │       ├── cancellation.rs   # cancel(), batch_cancel()
│   │       ├── storage.rs        # Nonce registry, filled order bitmap
│   │       ├── signature.rs      # Ed25519 signature verification
│   │       ├── fee.rs            # Keeper fee deduction & distribution
│   │       ├── dex/
│   │       │   ├── mod.rs        # DexAdapter trait definition
│   │       │   ├── soroswap.rs   # Soroswap v2 adapter
│   │       │   ├── phoenix.rs    # Phoenix DEX adapter
│   │       │   └── aquarius.rs   # Aquarius AMM adapter
│   │       ├── router.rs         # Multi-DEX best-price router
│   │       ├── events.rs         # Contract event definitions
│   │       └── errors.rs         # ContractError enum (all panic codes)
│   │
│   ├── limit_order_tests/        # Integration test crate (uses soroban-sdk testutils)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── helpers/
│   │       │   ├── mod.rs
│   │       │   ├── env.rs        # Test environment setup & token minting
│   │       │   ├── keypair.rs    # Test keypair factories
│   │       │   └── orders.rs     # Order builder helpers
│   │       ├── settlement_test.rs         # Happy-path settlement
│   │       ├── settlement_multi_dex_test.rs # Router picks best DEX
│   │       ├── expiry_test.rs             # Expired orders rejected
│   │       ├── replay_test.rs             # Nonce reuse rejected
│   │       ├── signature_test.rs          # Bad signature rejected
│   │       ├── min_amount_out_test.rs     # Slippage enforcement
│   │       ├── keeper_fee_test.rs         # Fee deduction & payout
│   │       ├── cancellation_test.rs       # cancel() and batch_cancel()
│   │       ├── preferred_dex_test.rs      # preferred_dex field honoured
│   │       └── fuzz/
│   │           ├── fuzz_settle.rs         # cargo-fuzz targets
│   │           └── fuzz_cancel.rs
│   │
│   └── mock_dex/                 # Minimal mock DEX for testing
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           └── pool.rs           # Configurable mock pool price
│
│  ── keeper/ ────────────────────────────────────────────────
│  Off-chain bot that watches the order book and submits
│  settlement transactions when price conditions are met.
│
├── keeper/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── jest.config.ts
│   ├── Dockerfile
│   ├── README.md
│   └── src/
│       ├── index.ts              # Process entry point, graceful shutdown
│       ├── config.ts             # Zod-validated config from env
│       │
│       ├── core/
│       │   ├── KeeperEngine.ts   # Orchestrates watcher + executor lifecycle
│       │   ├── OrderQueue.ts     # Priority queue sorted by keeper_fee desc
│       │   └── RateLimiter.ts    # Per-RPC-endpoint rate limiting
│       │
│       ├── watcher/
│       │   ├── Watcher.ts        # Main polling loop
│       │   ├── OrderFetcher.ts   # Pulls pending orders from order book API
│       │   ├── PriceChecker.ts   # Decides if order is currently fillable
│       │   └── ExpiryPruner.ts   # Removes locally cached expired orders
│       │
│       ├── executor/
│       │   ├── Executor.ts       # Builds & submits settlement transactions
│       │   ├── TxBuilder.ts      # Constructs Soroban invoke transactions
│       │   ├── TxSubmitter.ts    # RPC submit with retry & fee bumping
│       │   ├── NonceManager.ts   # Tracks keeper account sequence numbers
│       │   └── ResultParser.ts   # Parses contract return values & events
│       │
│       ├── pricer/
│       │   ├── Pricer.ts         # Aggregates quotes from all DEX adapters
│       │   ├── adapters/
│       │   │   ├── SoroswapPricer.ts
│       │   │   ├── PhoenixPricer.ts
│       │   │   └── AquariusPricer.ts
│       │   └── cache/
│       │       └── PriceCache.ts # TTL-based in-memory price cache
│       │
│       ├── metrics/
│       │   ├── MetricsServer.ts  # Prometheus /metrics HTTP endpoint
│       │   ├── counters.ts       # orders_attempted, orders_filled, errors
│       │   └── gauges.ts         # queue_depth, rpc_latency_ms
│       │
│       ├── alerts/
│       │   ├── AlertManager.ts   # Routes alerts to configured channels
│       │   ├── PagerDuty.ts      # PagerDuty integration
│       │   └── Slack.ts          # Slack webhook integration
│       │
│       ├── utils/
│       │   ├── logger.ts         # Structured JSON logger (pino)
│       │   ├── retry.ts          # Exponential backoff helper
│       │   ├── bigint.ts         # BigInt arithmetic helpers
│       │   └── stellar.ts        # Stellar SDK utility wrappers
│       │
│       └── __tests__/
│           ├── Watcher.test.ts
│           ├── Executor.test.ts
│           ├── Pricer.test.ts
│           ├── OrderQueue.test.ts
│           ├── TxBuilder.test.ts
│           └── mocks/
│               ├── MockRpc.ts
│               ├── MockOrderBookClient.ts
│               └── MockPricer.ts
│
│  ── orderbook/ ─────────────────────────────────────────────
│  REST + WebSocket service that stores and serves signed
│  pending orders. Acts as a notice board — not a trusted party.
│
├── orderbook/
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   ├── Dockerfile
│   ├── openapi.yaml              # OpenAPI 3.1 spec (source of truth)
│   ├── README.md
│   └── src/
│       ├── server.ts             # Express app factory
│       ├── app.ts                # Middleware stack, route mounting
│       ├── main.ts               # Process entry, DB connect, listen
│       │
│       ├── config/
│       │   ├── index.ts          # Zod env schema
│       │   └── database.ts       # Knex connection factory
│       │
│       ├── routes/
│       │   ├── orders.ts         # POST/GET/DELETE /orders
│       │   ├── pairs.ts          # GET /pairs — list active trading pairs
│       │   ├── makers.ts         # GET /makers/:address/orders
│       │   ├── stats.ts          # GET /stats — volume, fill rate
│       │   └── health.ts         # GET /health, GET /ready
│       │
│       ├── controllers/
│       │   ├── OrderController.ts
│       │   ├── PairController.ts
│       │   ├── MakerController.ts
│       │   └── StatsController.ts
│       │
│       ├── services/
│       │   ├── OrderService.ts           # Business logic, validation
│       │   ├── SignatureVerifier.ts      # Verifies maker signatures off-chain
│       │   ├── ExpiryService.ts          # Background job: marks expired orders
│       │   ├── StatisticsService.ts      # Computes aggregate stats
│       │   └── NotificationService.ts    # Triggers WS events on state change
│       │
│       ├── db/
│       │   ├── schema.sql                # Canonical DDL
│       │   ├── migrations/
│       │   │   ├── 001_create_orders.ts
│       │   │   ├── 002_add_pair_index.ts
│       │   │   ├── 003_add_stats_view.ts
│       │   │   └── 004_add_fill_metadata.ts
│       │   └── repositories/
│       │       ├── OrderRepository.ts    # CRUD for orders table
│       │       ├── PairRepository.ts     # Aggregated pair data
│       │       └── StatsRepository.ts    # Read-only stats queries
│       │
│       ├── middleware/
│       │   ├── auth.ts                   # Optional API key auth for writes
│       │   ├── rateLimiter.ts            # express-rate-limit per IP
│       │   ├── requestLogger.ts          # pino-http request logging
│       │   ├── errorHandler.ts           # Central error → HTTP response
│       │   └── validateSchema.ts         # Zod request body validation
│       │
│       ├── ws/
│       │   ├── feed.ts                   # WebSocket server (ws library)
│       │   ├── EventBus.ts               # Internal pub/sub bus
│       │   ├── Broadcaster.ts            # Fanouts events to WS clients
│       │   └── subscriptions.ts          # Per-pair subscription filter logic
│       │
│       ├── jobs/
│       │   ├── expiry-sweeper.ts         # Cron: expire old orders every minute
│       │   └── stats-aggregator.ts       # Cron: roll up hourly stats
│       │
│       └── __tests__/
│           ├── routes/
│           │   ├── orders.test.ts
│           │   ├── pairs.test.ts
│           │   └── health.test.ts
│           ├── services/
│           │   ├── OrderService.test.ts
│           │   └── SignatureVerifier.test.ts
│           └── db/
│               └── OrderRepository.test.ts
│
│  ── indexer/ ───────────────────────────────────────────────
│  Reads on-chain events (fills, cancels) from Stellar Horizon
│  and writes them to the database for analytics and UI history.
│
├── indexer/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── README.md
│   └── src/
│       ├── main.ts               # Entry point
│       ├── config.ts
│       │
│       ├── horizon/
│       │   ├── HorizonPoller.ts  # Polls Horizon for new ledgers
│       │   ├── EventParser.ts    # Decodes Soroban contract events
│       │   └── CursorStore.ts    # Persists last-processed ledger cursor
│       │
│       ├── processors/
│       │   ├── FillProcessor.ts  # Handles order_filled events
│       │   ├── CancelProcessor.ts
│       │   └── ExpireProcessor.ts
│       │
│       ├── db/
│       │   ├── FillRepository.ts
│       │   └── migrations/
│       │       └── 001_create_fills.ts
│       │
│       └── __tests__/
│           ├── EventParser.test.ts
│           └── FillProcessor.test.ts
│
│  ── sdk/ ────────────────────────────────────────────────────
│  Published NPM package. Provides order creation, signing,
│  and order book client for any TypeScript dApp or bot.
│
├── sdk/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── jest.config.ts
│   ├── vitest.config.ts          # Browser-compatible unit tests
│   ├── rollup.config.ts          # Builds CJS + ESM + types
│   ├── README.md
│   └── src/
│       ├── index.ts              # Public API surface (re-exports)
│       │
│       ├── order/
│       │   ├── OrderBuilder.ts   # Fluent builder for Order structs
│       │   ├── OrderSigner.ts    # Signs order hash with Stellar keypair
│       │   ├── OrderHasher.ts    # Canonical hash (matches on-chain logic)
│       │   ├── OrderValidator.ts # Client-side validation before submit
│       │   └── OrderTypes.ts     # LimitBuy, LimitSell, StopLoss, TakeProfit
│       │
│       ├── client/
│       │   ├── LimitOrderClient.ts       # Main SDK entry class
│       │   ├── OrderBookClient.ts        # HTTP client for order book API
│       │   ├── ContractClient.ts         # Soroban contract invocations
│       │   └── WebSocketClient.ts        # Real-time order updates feed
│       │
│       ├── simulation/
│       │   ├── Simulator.ts      # Calls simulateTransaction on RPC
│       │   └── ResultDecoder.ts  # Decodes XDR simulation results
│       │
│       ├── pricing/
│       │   ├── PriceQuoter.ts    # Gets DEX quotes via RPC simulation
│       │   └── ImpactCalculator.ts # Price impact & effective price
│       │
│       ├── types/
│       │   ├── Order.ts          # Core Order type (mirrors Rust struct)
│       │   ├── OrderStatus.ts    # pending | filled | cancelled | expired
│       │   ├── Quote.ts          # DEX quote response
│       │   └── Api.ts            # Order book API request/response types
│       │
│       ├── utils/
│       │   ├── amounts.ts        # toBaseUnits(), fromBaseUnits()
│       │   ├── price.ts          # amountOut → price, price → minAmountOut
│       │   ├── time.ts           # Expiry helpers
│       │   ├── address.ts        # Validate Stellar/Soroban addresses
│       │   └── errors.ts         # SDK error classes
│       │
│       └── __tests__/
│           ├── OrderBuilder.test.ts
│           ├── OrderSigner.test.ts
│           ├── OrderHasher.test.ts
│           ├── LimitOrderClient.test.ts
│           ├── PriceQuoter.test.ts
│           ├── amounts.test.ts
│           └── fixtures/
│               ├── orders.ts
│               └── signatures.ts
│
│  ── frontend/ ──────────────────────────────────────────────
│  Next.js 14 trading UI. App Router. Tailwind CSS.
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.ts
│   ├── jest.config.ts
│   ├── playwright.config.ts      # E2E tests
│   ├── Dockerfile
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── robots.txt
│   └── src/
│       ├── app/                              # Next.js App Router pages
│       │   ├── layout.tsx                    # Root layout (Providers, fonts)
│       │   ├── page.tsx                      # Landing / hero
│       │   ├── trade/
│       │   │   ├── page.tsx                  # Main trading interface
│       │   │   └── [pair]/page.tsx            # Pre-filtered by pair
│       │   ├── orders/
│       │   │   ├── page.tsx                  # Open orders table
│       │   │   └── [id]/page.tsx             # Single order detail
│       │   ├── history/
│       │   │   └── page.tsx                  # Filled / cancelled history
│       │   ├── analytics/
│       │   │   └── page.tsx                  # Volume, TVL, top pairs
│       │   ├── keeper/
│       │   │   └── page.tsx                  # Keeper leaderboard
│       │   └── api/                          # Next.js API routes (BFF)
│       │       ├── orders/route.ts
│       │       ├── quote/route.ts
│       │       └── stats/route.ts
│       │
│       ├── components/
│       │   ├── trade/
│       │   │   ├── OrderForm.tsx             # Place order panel
│       │   │   ├── OrderTypeSelector.tsx     # Limit/Stop/TP tabs
│       │   │   ├── PriceInput.tsx            # Target price input
│       │   │   ├── AmountInput.tsx           # Amount + max button
│       │   │   ├── KeeperFeeSlider.tsx       # Keeper tip selector
│       │   │   ├── ExpiryPicker.tsx          # Expiry time selector
│       │   │   ├── OrderPreview.tsx          # Shows estimated output
│       │   │   └── SubmitButton.tsx          # Sign & submit flow
│       │   │
│       │   ├── orders/
│       │   │   ├── OrdersTable.tsx           # Live open orders list
│       │   │   ├── OrderRow.tsx              # Single order row
│       │   │   ├── OrderStatusBadge.tsx
│       │   │   ├── CancelButton.tsx          # Signs cancel tx
│       │   │   └── OrderFilters.tsx          # Filter by pair / status
│       │   │
│       │   ├── history/
│       │   │   ├── HistoryTable.tsx
│       │   │   ├── FillDetails.tsx           # Fill price, tx link
│       │   │   └── ExportCsvButton.tsx
│       │   │
│       │   ├── chart/
│       │   │   ├── PriceChart.tsx            # TradingView lightweight-charts
│       │   │   ├── ChartToolbar.tsx          # Timeframe selector
│       │   │   └── OrderLinesOverlay.tsx     # Draw open orders on chart
│       │   │
│       │   ├── wallet/
│       │   │   ├── ConnectWallet.tsx         # Connect button + modal
│       │   │   ├── WalletModal.tsx           # Freighter / xBull selection
│       │   │   ├── AccountBadge.tsx          # Shows truncated address
│       │   │   └── BalanceDisplay.tsx        # Token balances
│       │   │
│       │   ├── analytics/
│       │   │   ├── VolumeChart.tsx
│       │   │   ├── TopPairsTable.tsx
│       │   │   └── FillRateGauge.tsx
│       │   │
│       │   └── ui/                           # Reusable primitives (shadcn/ui)
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Select.tsx
│       │       ├── Modal.tsx
│       │       ├── Tooltip.tsx
│       │       ├── Spinner.tsx
│       │       ├── Toast.tsx
│       │       └── Table.tsx
│       │
│       ├── hooks/
│       │   ├── useWallet.ts                  # Freighter / xBull adapter
│       │   ├── useOrders.ts                  # Fetch & subscribe to orders
│       │   ├── useOrderBook.ts               # Live order book feed (WS)
│       │   ├── usePrice.ts                   # Real-time DEX price
│       │   ├── useBalance.ts                 # Token balances via RPC
│       │   ├── usePlaceOrder.ts              # Sign + submit order flow
│       │   ├── useCancelOrder.ts             # Cancel order flow
│       │   └── useTransactionStatus.ts       # Poll tx until confirmed
│       │
│       ├── providers/
│       │   ├── WalletProvider.tsx            # Wallet context
│       │   ├── OrderBookProvider.tsx         # WebSocket + order state
│       │   ├── QueryProvider.tsx             # TanStack Query setup
│       │   └── ToastProvider.tsx             # Global notifications
│       │
│       ├── stores/
│       │   ├── orderStore.ts                 # Zustand: local order state
│       │   ├── walletStore.ts                # Zustand: wallet connection
│       │   └── settingsStore.ts              # Zustand: user preferences
│       │
│       ├── lib/
│       │   ├── sdk.ts                        # Singleton SDK client
│       │   ├── stellar.ts                    # Stellar SDK helpers
│       │   ├── formatters.ts                 # Number / date formatting
│       │   └── constants.ts                  # Token list, DEX addresses
│       │
│       └── __tests__/
│           ├── components/
│           │   ├── OrderForm.test.tsx
│           │   └── OrdersTable.test.tsx
│           ├── hooks/
│           │   ├── usePlaceOrder.test.ts
│           │   └── usePrice.test.ts
│           └── e2e/
│               ├── place-order.spec.ts       # Playwright E2E
│               ├── cancel-order.spec.ts
│               └── order-fill.spec.ts
│
│  ── docs/ ──────────────────────────────────────────────────
│
├── docs/
│   ├── architecture.md           # System design deep-dive
│   ├── contract-spec.md          # Full contract ABI & behaviour spec
│   ├── keeper-guide.md           # How to run a keeper, economics
│   ├── api-reference.md          # Order book REST API reference
│   ├── sdk-reference.md          # TypeScript SDK docs
│   ├── security.md               # Threat model, known risks
│   ├── adr/                      # Architecture Decision Records
│   │   ├── 001-off-chain-orderbook.md
│   │   ├── 002-stateless-contract.md
│   │   ├── 003-multi-dex-routing.md
│   │   └── 004-keeper-fee-model.md
│   └── diagrams/
│       ├── settlement-flow.png
│       ├── system-architecture.png
│       └── keeper-lifecycle.png
│
│  ── scripts/ ────────────────────────────────────────────────
│
├── scripts/
│   ├── deploy.sh                 # Deploy contract to testnet / mainnet
│   ├── upgrade.sh                # Upgrade existing contract (WASM hash update)
│   ├── seed-testnet.sh           # Place sample orders on testnet
│   ├── smoke-test.sh             # End-to-end smoke test against live testnet
│   ├── generate-types.sh         # Re-generate TS bindings from contract ABI
│   └── migrate-db.sh             # Run pending DB migrations
│
│  ── infra/ ─────────────────────────────────────────────────
│  Infrastructure-as-code (Terraform) for production deployment.
│
└── infra/
    ├── terraform/
    │   ├── main.tf               # Provider config, state backend
    │   ├── variables.tf
    │   ├── outputs.tf
    │   ├── modules/
    │   │   ├── orderbook/        # ECS task / Cloud Run service
    │   │   ├── indexer/          # ECS task / Cloud Run service
    │   │   ├── keeper/           # ECS task / Cloud Run service
    │   │   ├── database/         # RDS / Cloud SQL (PostgreSQL)
    │   │   └── cdn/              # CloudFront / Cloud CDN for frontend
    │   └── environments/
    │       ├── testnet.tfvars
    │       └── mainnet.tfvars
    ├── k8s/                      # Kubernetes manifests (optional)
    │   ├── orderbook-deployment.yaml
    │   ├── keeper-deployment.yaml
    │   ├── indexer-deployment.yaml
    │   └── ingress.yaml
    └── monitoring/
        ├── prometheus.yml        # Scrape config
        ├── grafana/
        │   └── dashboards/
        │       ├── keeper.json   # Keeper fill rate & earnings
        │       ├── orderbook.json
        │       └── indexer.json
        └── alerts/
            ├── keeper-down.yaml
            └── fill-rate-drop.yaml
```

### Workspace Summary

| Workspace | Language | Role |
|-----------|----------|------|
| `contracts/limit_order` | Rust | On-chain settlement, signature verification, DEX execution |
| `contracts/limit_order_tests` | Rust | Integration & fuzz tests for the contract |
| `contracts/mock_dex` | Rust | Mock DEX contract for local testing |
| `keeper` | TypeScript | Off-chain bot — watches prices, submits settlements |
| `orderbook` | TypeScript | REST + WebSocket order storage service |
| `indexer` | TypeScript | Reads on-chain fill/cancel events, writes to DB |
| `sdk` | TypeScript | NPM package for dApps and bots |
| `frontend` | TypeScript / React | Next.js trading UI |
| `infra` | Terraform / HCL | Production cloud infrastructure |

---

## Order Types

| Type | Trigger Condition | Use Case |
|------|------------------|----------|
| **Limit Buy** | Current price ≤ target price | Buy the dip |
| **Limit Sell** | Current price ≥ target price | Sell at a target |
| **Stop Loss** | Current price ≤ stop price | Protect against downside |
| **Take Profit** | Current price ≥ target price | Lock in gains automatically |

> Stop-loss and take-profit are UX labels. On-chain, they are identical to limit orders — the difference is only in how `min_amount_out` is calculated and how the frontend presents them.

---

## Smart Contract

### Order Struct

```rust
#[contracttype]
pub struct Order {
    /// Address of the order creator
    pub maker: Address,
    /// Token being sold (input)
    pub token_in: Address,
    /// Token being bought (output)
    pub token_out: Address,
    /// Exact amount of token_in to sell
    pub amount_in: i128,
    /// Minimum amount of token_out to receive (encodes the limit price + slippage)
    pub min_amount_out: i128,
    /// Unix timestamp after which the order is invalid
    pub expiry: u64,
    /// Per-user nonce to prevent replay attacks and enable cancellation
    pub nonce: u64,
    /// Fee paid to the keeper in token_in (taken before the swap)
    pub keeper_fee: i128,
    /// Optional: preferred DEX contract address (zero = any)
    pub preferred_dex: Option<Address>,
}
```

### Contract Methods

| Method | Description |
|--------|-------------|
| `settle(order, signature, dex_address)` | Execute a signed order. Called by a keeper. |
| `cancel(maker, nonce)` | Cancel a pending order. Only callable by the maker. |
| `is_filled(maker, nonce) → bool` | Check if an order nonce has been filled or cancelled. |
| `simulate_settlement(order) → i128` | Dry-run a settlement to preview output amount. |

#### `settle` Flow

```
settle(order, signature, dex_address)
  │
  ├── verify_signature(order, signature) → panic if invalid
  ├── check_expiry(order.expiry) → panic if expired
  ├── check_nonce(order.maker, order.nonce) → panic if filled/cancelled
  ├── deduct keeper_fee from amount_in
  ├── simulate swap on dex_address with (amount_in - keeper_fee)
  ├── assert simulated output ≥ order.min_amount_out → panic if not
  ├── transfer order.amount_in from maker to contract
  ├── execute swap on dex_address
  ├── transfer output tokens to order.maker
  ├── transfer keeper_fee to invoker (keeper)
  └── mark nonce as filled in storage
```

---

## Keeper Network

Keepers are off-chain bots that watch for fillable orders and submit settlement transactions, earning the `keeper_fee` specified in each order.

### How to Run a Keeper

```bash
cd keeper
cp .env.example .env
# Fill in your Stellar secret key and RPC endpoint
npm install
npm run start
```

### Keeper Configuration

```env
KEEPER_SECRET_KEY=S...          # Stellar secret key for signing transactions
RPC_URL=https://soroban-testnet.stellar.org
ORDER_BOOK_URL=http://localhost:3001
CONTRACT_ID=C...                # Settlement contract address
POLL_INTERVAL_MS=5000           # How often to check for fillable orders
MIN_PROFIT_THRESHOLD=0.001      # Skip orders where fee barely covers gas
```

### Keeper Economics

- Keeper earns `order.keeper_fee` (set by the order maker)
- Keeper pays the Soroban transaction fee (typically < 0.01 XLM)
- Profitable when: `keeper_fee > tx_fee + opportunity_cost`
- Orders with higher keeper fees are executed faster in a competitive keeper market

---

## Off-Chain Order Book

A lightweight REST + WebSocket service that stores signed pending orders.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Submit a new signed order |
| `GET` | `/orders` | List orders (filterable by pair, maker, status) |
| `GET` | `/orders/:id` | Get a specific order |
| `DELETE` | `/orders/:id` | Cancel an order (requires maker signature) |
| `GET` | `/health` | Service health check |

### Submit an Order

```http
POST /orders
Content-Type: application/json

{
  "order": {
    "maker": "G...",
    "token_in": "C...",
    "token_out": "C...",
    "amount_in": "1000000000",
    "min_amount_out": "950000000",
    "expiry": 1790000000,
    "nonce": 1,
    "keeper_fee": "1000000",
    "preferred_dex": null
  },
  "signature": "..."
}
```

### WebSocket Feed

Connect to `ws://localhost:3001/feed` to receive real-time events:

```json
{ "event": "order_created", "order": { ... } }
{ "event": "order_filled",  "order_id": "...", "tx_hash": "..." }
{ "event": "order_cancelled", "order_id": "..." }
{ "event": "order_expired", "order_id": "..." }
```

---

## TypeScript SDK

Install:

```bash
npm install @soroban-limit-orders/sdk
```

Usage:

```typescript
import { LimitOrderClient, createLimitOrder } from '@soroban-limit-orders/sdk';
import { Keypair } from '@stellar/stellar-sdk';

const client = new LimitOrderClient({
  orderBookUrl: 'https://orderbook.yourdomain.com',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'C...',
});

const keypair = Keypair.fromSecret('S...');

// Build and sign a limit sell order
const order = createLimitOrder({
  maker: keypair.publicKey(),
  tokenIn: 'C...USDC',
  tokenOut: 'C...XLM',
  amountIn: BigInt('1000000000'),   // 100 USDC (7 decimals)
  minAmountOut: BigInt('9500000000'), // min 950 XLM
  expiry: Math.floor(Date.now() / 1000) + 86400, // 24h from now
  nonce: 1n,
  keeperFee: BigInt('1000000'),    // 0.1 USDC tip to keeper
});

const signature = order.sign(keypair);
const orderId = await client.submitOrder(order, signature);

console.log('Order submitted:', orderId);

// Cancel an order
await client.cancelOrder(orderId, keypair);

// Check if an order is fillable right now
const fillable = await client.isFillable(orderId);
```

---

## Frontend

The frontend is a Next.js 14 app with App Router. It supports:

- **Freighter** and **xBull** wallet connections
- Order placement form with real-time price preview
- Active orders table with cancel functionality
- Order history with fill prices and transaction links
- Price chart (TradingView-style) using on-chain data

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Rust](https://www.rust-lang.org/tools/install) | ≥ 1.74 | Build Soroban contracts |
| [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) | ≥ 0.9 | Deploy & interact with contracts |
| [Node.js](https://nodejs.org/) | ≥ 20 | Keeper, order book, frontend |
| [Docker](https://www.docker.com/) | ≥ 24 | Optional: run services locally |
| [Freighter Wallet](https://www.freighter.app/) | Latest | Test the frontend |

### Installation

```bash
# Clone the repository
git clone https://github.com/yourorg/soroban-limit-orders.git
cd soroban-limit-orders

# Install all Node.js dependencies
npm install --workspaces

# Build the Soroban contract
cd contracts/limit_order
cargo build --target wasm32-unknown-unknown --release
```

### Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

```env
# Stellar Network
NETWORK=testnet
RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Contract
CONTRACT_ID=C...

# Order Book Service
DATABASE_URL=./orderbook.db
ORDER_BOOK_PORT=3001

# Keeper
KEEPER_SECRET_KEY=S...
POLL_INTERVAL_MS=5000
MIN_PROFIT_THRESHOLD=0.001

# Frontend
NEXT_PUBLIC_CONTRACT_ID=C...
NEXT_PUBLIC_ORDER_BOOK_URL=http://localhost:3001
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
```

### Running Locally

**Option A — Docker Compose (recommended)**

```bash
docker-compose up
```

This starts:
- Order book service on `http://localhost:3001`
- Keeper bot (watching testnet)
- Frontend on `http://localhost:3000`

**Option B — Manual**

```bash
# Terminal 1: Order book service
cd orderbook && npm run dev

# Terminal 2: Keeper bot
cd keeper && npm run start

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## Deployment

### Deploy the Contract

```bash
# Build the contract
cd contracts/limit_order
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/limit_order.wasm \
  --source YOUR_SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Save the output contract ID to your .env
```

### Run the Keeper Bot

For production, run the keeper as a persistent process:

```bash
# Using PM2
npm install -g pm2
cd keeper
pm2 start npm --name "limit-order-keeper" -- run start
pm2 save
```

Alternatively, deploy with Docker:

```bash
docker build -t limit-order-keeper ./keeper
docker run -d --env-file .env limit-order-keeper
```

### Deploy the Frontend

The frontend deploys to any static hosting provider:

```bash
cd frontend
npm run build

# Vercel
npx vercel --prod

# Or export static
npm run export && npx serve out/
```

---

## Security

### Threat Model

This protocol assumes:
- The Soroban smart contract runtime is correct
- The underlying DEX (Soroswap/Phoenix) is non-malicious
- Stellar's BFT consensus is sound
- User keypairs are kept secret

It does **not** trust:
- The order book service (orders are independently verifiable on-chain)
- Individual keeper bots (any keeper competing = fair execution)
- The frontend (all critical validation happens on-chain)

### Known Risks & Mitigations

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Front-running** | Keeper or MEV bot sandwiches the settlement tx | `min_amount_out` enforced on-chain; slippage tolerance set by user |
| **Stale price execution** | Keeper submits when price has moved | Contract simulates via DEX before executing; tx reverts if `min_amount_out` not met |
| **Replay attacks** | Filled order submitted again | Per-maker nonce tracked on-chain; nonce invalidated on fill or cancel |
| **Keeper centralization** | Single keeper = censorship risk | Permissionless keeper design; anyone can submit settlements |
| **Order book unavailability** | Off-chain service goes down | Orders are signed and can be resubmitted to any compatible order book |
| **Reentrancy** | Malicious DEX calls back into contract | Soroban's execution model prevents reentrancy |
| **Expired order execution** | Keeper executes stale order | Expiry timestamp enforced on-chain; contract panics if `now > expiry` |
| **Dust keeper fees** | Fee too low to incentivize keepers | Front-end warns users when keeper fee is below estimated tx cost |

### Audit Status

An audit is planned before mainnet launch. See [SECURITY.md](./SECURITY.md) for the responsible disclosure policy.

---

## Testing

### Contract Tests

```bash
cd contracts/limit_order
cargo test
```

Tests cover:
- Valid settlement execution
- Rejection of expired orders
- Rejection of replayed nonces
- Rejection of invalid signatures
- Enforcement of `min_amount_out`
- Keeper fee distribution
- Maker cancellation

### Keeper Tests

```bash
cd keeper
npm test
```

### SDK Tests

```bash
cd sdk
npm test
```

### End-to-End Tests

```bash
# Requires testnet connection
npm run test:e2e
```

---

## Roadmap

### Phase 1 — Core Protocol ✅ (in progress)
- [x] Settlement contract (Rust)
- [x] Order struct & signature verification
- [x] Nonce-based replay protection
- [x] Off-chain order book service (SQLite)
- [ ] Basic keeper bot
- [ ] TypeScript SDK

### Phase 2 — DEX Integration
- [ ] Soroswap integration
- [ ] Phoenix DEX integration
- [ ] Multi-DEX best-price routing at settlement time
- [ ] Aquarius integration

### Phase 3 — Frontend & UX
- [ ] Next.js trading interface
- [ ] Freighter + xBull wallet support
- [ ] Real-time order status via WebSocket
- [ ] Order history & CSV export (tax reporting)
- [ ] Mobile-responsive design

### Phase 4 — Decentralization & Scale
- [ ] Open keeper network documentation
- [ ] On-chain order indexing (optional)
- [ ] Order book mirroring (multiple operators)
- [ ] Keeper leaderboard & analytics
- [ ] Gasless order submission (fee relayer)

### Phase 5 — Advanced Features
- [ ] TWAP orders (time-weighted average price)
- [ ] Recurring / DCA orders
- [ ] Cross-chain orders via Stellar bridge
- [ ] Order book API for third-party integrations

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes with tests
4. Ensure all tests pass: `cargo test && npm test --workspaces`
5. Open a pull request against `main`

### Development Guidelines

- All Soroban contract changes must include unit tests
- Keeper and SDK changes must maintain backward compatibility
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Run `cargo clippy` and `cargo fmt` before committing contract code
- Run `npm run lint` before committing TypeScript code

---

## License

[MIT](./LICENSE) — free to use, modify, and distribute.

---

## Acknowledgements

- [Stellar Development Foundation](https://stellar.org/) for the Soroban platform
- [Soroswap](https://soroswap.finance/) and [Phoenix Protocol](https://phoenix-hub.io/) for DEX infrastructure
- The Stellar developer community

---

> Built on Soroban · Powered by Stellar · Non-custodial · Permissionless
