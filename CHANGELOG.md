# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-09

### Added
- **Soroban Settlement Contract** (`contracts/limit_order/`)
  - Order struct with maker, token_in, token_out, amount_in, min_amount_out, expiry, nonce, keeper_fee, preferred_dex
  - Order types: LimitBuy, LimitSell, StopLoss, TakeProfit
  - Canonical order hash function matching TypeScript SDK
  - Contract errors: InvalidSignature, OrderExpired, OrderAlreadyFilled, OrderCancelled, SlippageExceeded, InsufficientKeeperFee, InvalidNonce, UnauthorizedCaller, DexCallFailed
  - Nonce-based replay protection (filled/cancelled bitmap)
  - Ed25519 signature verification
  - Keeper fee deduction and transfer
  - Settlement flow with multi-DEX routing
  - Order cancellation (single and batch up to 10)
  - Contract events: order_filled, order_cancelled, order_expired

- **DEX Adapters & Router**
  - DexAdapter trait with swap() and get_quote()
  - Soroswap v2 adapter
  - Phoenix DEX adapter
  - Aquarius AMM adapter
  - Best-price router respecting preferred_dex field
  - Multi-DEX settlement integration tests
  - Preferred DEX enforcement tests
  - Slippage protection tests

- **Order Book Service** (`orderbook/`)
  - Express REST API with middleware stack (pino logging, rate limiting, Zod validation, optional API key auth)
  - SQLite (dev) / PostgreSQL (prod) via Knex
  - 4 migrations: orders table, pair index, stats view, fill metadata
  - OrderRepository, PairRepository, StatsRepository
  - OrderService with signature verification
  - REST endpoints: POST/GET/DELETE /orders, GET /pairs, GET /makers/:address/orders, GET /stats, GET /health, GET /ready
  - WebSocket feed: order_created, order_filled, order_cancelled, order_expired with pair filtering
  - Background jobs: expiry sweeper (60s), stats aggregator (hourly)
  - Comprehensive test suite (routes, services, repositories)

- **Keeper Bot** (`keeper/`)
  - KeeperEngine with graceful shutdown
  - OrderQueue (priority by keeper_fee desc)
  - Watcher: OrderFetcher, PriceChecker, ExpiryPruner
  - Executor: TxBuilder, TxSubmitter (retry + fee bump), ResultParser
  - Pricer: SoroswapPricer, PhoenixPricer, AquariusPricer with TTL cache
  - Prometheus metrics on /metrics (counters, gauges)
  - AlertManager with Slack webhook integration
  - Full test suite with mocked RPC, order book, pricer

- **TypeScript SDK** (`sdk/`)
  - OrderBuilder fluent API matching README usage
  - OrderHasher (canonical hash matching Rust)
  - OrderSigner (Ed25519 via @stellar/stellar-sdk)
  - OrderValidator (client-side validation)
  - OrderBookClient, ContractClient, WebSocketClient, LimitOrderClient
  - PriceQuoter (multi-DEX simulation)
  - ImpactCalculator (price impact, min amount out)
  - Utilities: amounts, price, time, address, errors
  - Rollup build (CJS + ESM + .d.ts)
  - Test suite with known vectors

- **Indexer** (`indexer/`)
  - HorizonPoller (cursor-based pagination)
  - EventParser (XDR decoding for order_filled, order_cancelled, order_expired)
  - CursorStore (persistent cursor)
  - FillProcessor, CancelProcessor, ExpireProcessor
  - Test suite with XDR fixtures

- **Frontend** (`frontend/`)
  - Next.js 14 App Router with Tailwind CSS + shadcn/ui
  - WalletProvider + useWallet (Freighter integration)
  - Trade page: OrderForm, OrderTypeSelector, OrderPreview, SubmitButton
  - Orders page: OrdersTable with real-time WebSocket updates
  - PriceChart placeholder (lightweight-charts ready)
  - Zustand stores, TanStack Query, React Hook Form

- **CI/CD** (`.github/workflows/`)
  - ci.yml: Contract tests, orderbook tests, keeper tests, SDK tests, indexer tests, frontend build
  - deploy-testnet.yml: Contract deploy, Docker images to GHCR, Vercel frontend deploy
  - audit.yml: Weekly cargo audit + npm audit
  - dependabot.yml: Weekly dependency updates

- **Documentation & Scripts**
  - CONTRIBUTING.md with setup, commit format, PR process, DEX adapter guide
  - SECURITY.md with disclosure policy, scope, best practices
  - scripts/deploy.sh (contract deploy + .env update)
  - scripts/smoke-test.sh (health checks)

### Changed
- Updated better-sqlite3 to 11.6.0 for Node.js 24 compatibility

### Fixed
- Signature verifier public key derivation (placeholder for strkey decode)
- Migration 004 no-op for fresh installs