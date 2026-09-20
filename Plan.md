# 7-Day Intensive Development Plan
## Soroban Limit Order Protocol — 85% Completion Sprint

This plan simulates 7 days of intensive development across all workspaces defined in the README.
Each day has a clear focus area, specific deliverables, completion targets, and copy-paste
prompts you can use directly with an AI coding assistant to implement that day's work.

---

## Sprint Overview

| Day | Focus | Primary Workspace | Target Completion |
|-----|-------|-------------------|-------------------|
| 1 | Monorepo scaffold + Soroban contract core | `contracts/`, root | 10% |
| 2 | Contract: settlement, cancellation, storage | `contracts/` | 25% |
| 3 | Contract: DEX adapters, router, full test suite | `contracts/` | 40% |
| 4 | Order Book Service (REST + WebSocket + DB) | `orderbook/` | 55% |
| 5 | Keeper Bot (watcher, executor, pricer) | `keeper/` | 68% |
| 6 | TypeScript SDK + Indexer | `sdk/`, `indexer/` | 78% |
| 7 | Frontend core + CI/CD + integration hardening | `frontend/`, `.github/` | 85% |

---

## Completion Tracking

```
Day 0  ░░░░░░░░░░░░░░░░░░░░  0%
Day 1  ██░░░░░░░░░░░░░░░░░░  10%
Day 2  █████░░░░░░░░░░░░░░░  25%
Day 3  ████████░░░░░░░░░░░░  40%
Day 4  ███████████░░░░░░░░░  55%
Day 5  █████████████░░░░░░░  68%
Day 6  ███████████████░░░░░  78%
Day 7  █████████████████░░░  85%
```

The remaining 15% covers: professional security audit, mainnet DEX contract integrations
(production Soroswap/Phoenix addresses), full Playwright E2E suite, Terraform infra,
and Grafana dashboards — best completed with live testnet access and real wallet testing.

---

## Day 1 — Monorepo Scaffold + Contract Core

**Goal:** Working repository skeleton with a compilable Soroban contract that defines
the Order struct, error types, and contract entry points.

**Deliverables:**
- [x] Root `package.json` with NPM workspaces (`keeper`, `orderbook`, `sdk`, `frontend`, `indexer`)
- [x] `pnpm-workspace.yaml` and `turbo.json` pipeline
- [x] `Makefile` with `build`, `test`, `lint`, `dev` targets
- [x] `docker-compose.yml` wiring orderbook + keeper + frontend
- [x] `.env.example` with all variables from the README documented
- [x] `contracts/Cargo.toml` workspace manifest
- [x] `contracts/rust-toolchain.toml` pinning the Soroban-compatible Rust toolchain
- [x] `contracts/limit_order/src/lib.rs` — contract entry points with `#[contractimpl]`
- [x] `contracts/limit_order/src/order.rs` — `Order` struct, `OrderType` enum, canonical hash function
- [x] `contracts/limit_order/src/errors.rs` — `ContractError` enum covering all failure modes
- [x] `contracts/mock_dex/` — minimal mock DEX contract with a configurable pool price
- [x] Contract compiles: `cargo build --target wasm32-unknown-unknown --release` *(built via `stellar contract build` — see note below)*

> **Day 1 note:** `soroban-sdk 28` (the SDK version matching the installed stellar-cli)
> rejects the legacy `wasm32-unknown-unknown` target on Rust ≥ 1.82 and requires the
> `wasm32v1-none` target plus the `stellar contract build` command. The equivalent
> verified command is: `cd contracts && stellar contract build`.

**Completion after day:** 10%

---

### Day 1 Prompts

**Prompt 1.1 — Monorepo root scaffold**
```
Set up the root of a TypeScript monorepo for a project called soroban-limit-orders.

Create:
- package.json with NPM workspaces pointing to keeper, orderbook, sdk, frontend, indexer
- pnpm-workspace.yaml listing those same packages
- turbo.json with a Turborepo pipeline: build depends on upstream build, test depends on build, lint has no dependencies
- Makefile with targets: build (turbo run build), test (turbo run test), lint (turbo run lint), dev (docker-compose up)
- .gitignore covering node_modules, dist, target, .env, *.wasm
- .env.example with every environment variable documented in the README (NETWORK, RPC_URL, HORIZON_URL, NETWORK_PASSPHRASE, CONTRACT_ID, DATABASE_URL, ORDER_BOOK_PORT, KEEPER_SECRET_KEY, POLL_INTERVAL_MS, MIN_PROFIT_THRESHOLD, NEXT_PUBLIC_* frontend vars)
- docker-compose.yml that starts three services: orderbook (port 3001), keeper (depends on orderbook), frontend (port 3000, depends on orderbook). Each service uses its local Dockerfile and reads from .env.
```

**Prompt 1.2 — Rust workspace and toolchain**
```
Inside a contracts/ directory, create the Rust workspace for the Soroban Limit Order Protocol.

Create:
- contracts/Cargo.toml as a Cargo workspace manifest with members: ["limit_order", "limit_order_tests", "mock_dex"]
- contracts/rust-toolchain.toml pinning stable Rust at the version compatible with soroban-sdk 21
- contracts/limit_order/Cargo.toml with dependencies: soroban-sdk = { version = "21.0.0", features = ["testutils"] }

The workspace must compile cleanly with:
  cargo build --target wasm32-unknown-unknown --release
```

**Prompt 1.3 — Order struct and error types**
```
In contracts/limit_order/src/, implement the following Soroban contract foundation files.

order.rs:
- Define #[contracttype] pub struct Order with these exact fields from the README:
  maker: Address, token_in: Address, token_out: Address, amount_in: i128,
  min_amount_out: i128, expiry: u64, nonce: u64, keeper_fee: i128, preferred_dex: Option<Address>
- Define #[contracttype] pub enum OrderType with variants: LimitBuy, LimitSell, StopLoss, TakeProfit
- Implement order_hash(order: &Order) -> BytesN<32> using soroban_sdk's SHA-256 that produces
  a canonical hash matching the hash the TypeScript SDK will sign client-side

errors.rs:
- Define #[contracterror] pub enum ContractError with variants and i32 codes for:
  InvalidSignature(1), OrderExpired(2), OrderAlreadyFilled(3), OrderCancelled(4),
  SlippageExceeded(5), InsufficientKeeperFee(6), InvalidNonce(7), UnauthorizedCaller(8), DexCallFailed(9)

lib.rs:
- Define the contract struct and #[contractimpl] block with stub signatures for:
  settle(env, order, signature, dex_address), cancel(env, maker, nonce),
  is_filled(env, maker, nonce) -> bool, simulate_settlement(env, order) -> i128
- Each stub should panic with a todo!() for now
```

**Prompt 1.4 — Mock DEX contract**
```
Create contracts/mock_dex/src/lib.rs — a minimal Soroban contract used only in tests.

The mock DEX must:
- Store a configurable exchange rate (token_in → token_out ratio) in contract storage
- Expose set_price(env, token_in, token_out, rate: i128) callable by the contract admin
- Expose swap(env, token_in, token_out, amount_in: i128) -> i128 that:
  - Looks up the stored rate
  - Returns amount_in * rate / 1_000_000 (6 decimal precision)
  - Panics with a descriptive error if no rate is set for the pair
- Expose get_quote(env, token_in, token_out, amount_in: i128) -> i128 — same calculation, no state change

This mock will be used by integration tests in contracts/limit_order_tests/ to simulate Soroswap, Phoenix, and Aquarius without hitting live contracts.
```

---

## Day 2 — Contract: Settlement, Cancellation & Storage

**Goal:** Fully implemented and tested settlement and cancellation logic. The contract
can verify signatures, enforce expiry, prevent replays, deduct keeper fees, and mark
nonces as filled.

**Deliverables:**
- [ ] `storage.rs` — nonce registry using `soroban_sdk::Map`, filled/cancelled bitmap
- [ ] `signature.rs` — Ed25519 signature verification against the canonical order hash
- [ ] `fee.rs` — keeper fee deduction from `amount_in` before swap, transfer to invoker
- [ ] `settlement.rs` — full `settle()` flow matching the README step-by-step
- [ ] `cancellation.rs` — `cancel()` (maker-only) and `batch_cancel()` (cancel up to 10 nonces)
- [ ] `events.rs` — contract events: `order_filled`, `order_cancelled`, `order_expired`
- [ ] Integration tests: `settlement_test.rs`, `expiry_test.rs`, `replay_test.rs`, `signature_test.rs`, `keeper_fee_test.rs`, `cancellation_test.rs`
- [ ] All tests pass: `cargo test`

**Completion after day:** 25%

---

### Day 2 Prompts

**Prompt 2.1 — Storage layer**
```
Implement contracts/limit_order/src/storage.rs for the Soroban Limit Order settlement contract.

Requirements:
- Use soroban_sdk storage (env.storage().persistent()) with typed keys
- Define a StorageKey enum with variants: FilledNonce(Address, u64), CancelledNonce(Address, u64)
- Implement:
  mark_filled(env: &Env, maker: &Address, nonce: u64)
  mark_cancelled(env: &Env, maker: &Address, nonce: u64)
  is_filled(env: &Env, maker: &Address, nonce: u64) -> bool
  is_cancelled(env: &Env, maker: &Address, nonce: u64) -> bool
  is_used(env: &Env, maker: &Address, nonce: u64) -> bool  // true if filled OR cancelled
- Storage entries must use bump_ttl to extend their lifetime so nonces are not garbage-collected
  before the order would naturally expire
```

**Prompt 2.2 — Signature verification**
```
Implement contracts/limit_order/src/signature.rs.

Requirements:
- Implement verify_order_signature(env: &Env, order: &Order, signature: &BytesN<64>) -> Result<(), ContractError>
- The function must:
  1. Recompute the canonical order hash using order_hash() from order.rs
  2. Use soroban_sdk's crypto.ed25519_verify() to verify the signature against order.maker
  3. Return ContractError::InvalidSignature if verification fails
- The hash must be computed identically to how the TypeScript SDK will hash orders client-side
  (fields serialized in deterministic order: maker, token_in, token_out, amount_in,
  min_amount_out, expiry, nonce, keeper_fee, preferred_dex)
- Add a unit test inside the file that creates a known keypair, signs a known order, and
  verifies the function accepts valid signatures and rejects tampered ones
```

**Prompt 2.3 — Keeper fee logic**
```
Implement contracts/limit_order/src/fee.rs.

Requirements:
- Implement deduct_keeper_fee(amount_in: i128, keeper_fee: i128) -> Result<i128, ContractError>
  - Returns amount_in - keeper_fee (the net amount to swap)
  - Returns ContractError::InsufficientKeeperFee if keeper_fee >= amount_in
  - Returns ContractError::InsufficientKeeperFee if keeper_fee < 0
- Implement transfer_keeper_fee(env: &Env, token: &Address, from: &Address, keeper: &Address, fee: i128)
  - Transfers keeper_fee units of token_in from the contract to the keeper's address
  - The keeper is env.invoker() — whoever submitted the settle() transaction
```

**Prompt 2.4 — Settlement and cancellation**
```
Implement contracts/limit_order/src/settlement.rs and contracts/limit_order/src/cancellation.rs.

settlement.rs — implement settle(env, order, signature, dex_address):
Follow the exact flow from the README:
1. verify_order_signature(env, &order, &signature) → return error if invalid
2. assert env.ledger().timestamp() < order.expiry → ContractError::OrderExpired
3. assert !storage::is_used(env, &order.maker, order.nonce) → ContractError::OrderAlreadyFilled or OrderCancelled
4. let swap_amount = fee::deduct_keeper_fee(order.amount_in, order.keeper_fee)?
5. Call dex_address.swap(token_in, token_out, swap_amount) via cross-contract call → get actual_out
6. assert actual_out >= order.min_amount_out → ContractError::SlippageExceeded
7. token_in.transfer(from: order.maker, to: contract, amount: order.amount_in)
8. Execute the DEX swap
9. token_out.transfer(from: contract, to: order.maker, amount: actual_out)
10. fee::transfer_keeper_fee(env, &order.token_in, &contract, &env.invoker(), order.keeper_fee)
11. storage::mark_filled(env, &order.maker, order.nonce)
12. Emit order_filled event

Also implement simulate_settlement(env, order) -> i128:
- Same flow but read-only: only checks conditions and returns the expected output amount
- Does not transfer tokens or mark the nonce

cancellation.rs — implement:
- cancel(env, maker, nonce):
  - maker.require_auth()
  - assert !storage::is_used(env, &maker, nonce)
  - storage::mark_cancelled(env, &maker, nonce)
  - Emit order_cancelled event
- batch_cancel(env, maker, nonces: Vec<u64>):
  - maker.require_auth()
  - Assert nonces.len() <= 10 to prevent DoS
  - Call cancel() logic for each nonce, skip already-used ones silently
```

**Prompt 2.5 — Contract events**
```
Implement contracts/limit_order/src/events.rs.

Define and emit three contract events using soroban_sdk's env.events().publish():

1. emit_order_filled(env, maker, nonce, token_in, token_out, amount_in, amount_out, keeper)
   - topics: ["order_filled", maker]
   - data: { nonce, token_in, token_out, amount_in, amount_out, keeper }

2. emit_order_cancelled(env, maker, nonce)
   - topics: ["order_cancelled", maker]
   - data: { nonce }

3. emit_order_expired(env, maker, nonce)
   - topics: ["order_expired", maker]
   - data: { nonce }

Events must use #[contracttype] data structs so they are ABI-decodable by the TypeScript indexer.
```

**Prompt 2.6 — Core contract integration tests**
```
Create the following integration tests in contracts/limit_order_tests/src/ using soroban-sdk testutils.

Use the helpers pattern: helpers/env.rs creates a test Env with funded token balances,
helpers/keypair.rs generates test Ed25519 keypairs, helpers/orders.rs has an OrderBuilder
that creates pre-signed orders for test scenarios.

Write these test files:
- settlement_test.rs: happy-path settle() — assert maker receives token_out, keeper receives keeper_fee, nonce is marked filled
- expiry_test.rs: settle() with order.expiry = now - 1 must return ContractError::OrderExpired
- replay_test.rs: settling the same order twice must return ContractError::OrderAlreadyFilled on second call
- signature_test.rs: settle() with a signature from a different keypair must return ContractError::InvalidSignature
- keeper_fee_test.rs: assert keeper receives exactly order.keeper_fee, assert swap uses amount_in - keeper_fee
- cancellation_test.rs: cancel() marks nonce as cancelled; subsequent settle() returns ContractError::OrderCancelled;
  batch_cancel() cancels multiple nonces in one call; cancel() by non-maker panics

All tests must pass with: cargo test
```

---

## Day 3 — Contract: DEX Adapters, Router & Fuzz Tests

**Goal:** Multi-DEX routing is implemented. The contract can route through Soroswap,
Phoenix, and Aquarius (via mock adapters in tests), always picking the best price.
Fuzz targets are registered.

**Deliverables:**
- [ ] `dex/mod.rs` — `DexAdapter` trait with `swap()` and `get_quote()` methods
- [ ] `dex/soroswap.rs` — Soroswap v2 cross-contract adapter
- [ ] `dex/phoenix.rs` — Phoenix DEX cross-contract adapter
- [ ] `dex/aquarius.rs` — Aquarius AMM cross-contract adapter
- [ ] `router.rs` — multi-DEX best-price router, respects `preferred_dex` field
- [ ] `settlement_multi_dex_test.rs` — router selects the DEX with best output
- [ ] `preferred_dex_test.rs` — `preferred_dex` field forces a specific DEX
- [ ] `min_amount_out_test.rs` — slippage guard rejects trades below `min_amount_out`
- [ ] `fuzz/fuzz_settle.rs` and `fuzz/fuzz_cancel.rs` cargo-fuzz targets registered
- [ ] `cargo clippy -- -D warnings` passes with zero warnings

**Completion after day:** 40%

---

### Day 3 Prompts

**Prompt 3.1 — DexAdapter trait and adapters**
```
Implement the DEX adapter layer in contracts/limit_order/src/dex/.

dex/mod.rs:
- Define a DexAdapter trait with two methods:
  fn get_quote(env: &Env, token_in: Address, token_out: Address, amount_in: i128) -> i128
  fn swap(env: &Env, token_in: Address, token_out: Address, amount_in: i128, min_out: i128) -> i128
- Both methods take the DEX contract address as a parameter and invoke it via cross-contract call

dex/soroswap.rs:
- Implement SoroswapAdapter using the Soroswap v2 router interface
- swap() calls router.swap_exact_tokens_for_tokens(amount_in, min_out, path, to, deadline)
- get_quote() calls router.get_amounts_out(amount_in, path) and returns the last element

dex/phoenix.rs:
- Implement PhoenixAdapter using the Phoenix pair contract interface
- swap() calls pair.swap(amount_in, min_out, to)
- get_quote() calls pair.simulate_swap(amount_in)

dex/aquarius.rs:
- Implement AquariusAdapter using the Aquarius AMM interface
- Follows the same pattern

For testnet/local testing, each adapter should gracefully handle the case where the DEX
contract is the mock_dex contract from contracts/mock_dex/.
```

**Prompt 3.2 — Multi-DEX best-price router**
```
Implement contracts/limit_order/src/router.rs.

Requirements:
- Implement find_best_dex(env: &Env, order: &Order, available_dexes: &[Address]) -> (Address, i128)
  - Calls get_quote() on each DEX in available_dexes
  - Returns the DEX address and expected output amount that maximises output
  - If order.preferred_dex is Some(addr), only query that DEX and return it directly
    without checking alternatives
- Implement route_swap(env: &Env, order: &Order, dex_address: &Address, swap_amount: i128) -> i128
  - Calls the correct adapter's swap() based on which DEX address is passed
  - Dispatches to SoroswapAdapter, PhoenixAdapter, or AquariusAdapter
  - Falls back to a generic cross-contract call for unknown DEX addresses

The settlement.rs settle() function must call router::find_best_dex() when order.preferred_dex
is None, and router::route_swap() to execute the winning swap.
```

**Prompt 3.3 — Multi-DEX and routing integration tests**
```
Add the following integration tests to contracts/limit_order_tests/src/:

settlement_multi_dex_test.rs:
- Deploy three mock DEX instances with different exchange rates
- Call settle() without a preferred_dex
- Assert the contract chose the DEX that returned the highest amount_out
- Assert the maker received the highest possible output

preferred_dex_test.rs:
- Deploy two mock DEX instances where DEX B offers a better rate than DEX A
- Create an order with preferred_dex = Some(dex_a_address)
- Call settle()
- Assert the swap executed on DEX A (preferred), not DEX B (better price)
- Assert the maker received DEX A's output amount

min_amount_out_test.rs:
- Deploy a mock DEX with a rate that produces output below order.min_amount_out
- Call settle()
- Assert it returns ContractError::SlippageExceeded
- Assert no tokens were transferred (transaction rolled back)

All tests must pass with: cargo test
```

**Prompt 3.4 — Cargo-fuzz targets**
```
Add fuzz testing infrastructure to the Soroban contract.

Create contracts/limit_order_tests/src/fuzz/fuzz_settle.rs:
- A cargo-fuzz target that takes arbitrary bytes as input
- Parses the bytes into a (Order, BytesN<64>, Address) tuple using arbitrary::Arbitrary
- Calls settle() on a fresh test environment
- Asserts the function either returns Ok or one of the known ContractError variants
- Must never panic with an unexpected error or cause undefined behaviour

Create contracts/limit_order_tests/src/fuzz/fuzz_cancel.rs:
- A cargo-fuzz target that calls cancel() with arbitrary (Address, u64) inputs
- Asserts it either succeeds or returns a known error

Add a [fuzz] section to the Cargo.toml and document how to run with:
  cargo fuzz run fuzz_settle
```

---

## Day 4 — Order Book Service

**Goal:** A fully functional REST + WebSocket order book service with database persistence,
signature verification, background jobs, and comprehensive tests. Runs locally with SQLite,
production-ready for PostgreSQL.

**Deliverables:**
- [ ] Express app with middleware stack (rate limiter, request logger, error handler, Zod validation)
- [ ] Database schema (`schema.sql`) and 4 Knex migrations
- [ ] `OrderRepository`, `PairRepository`, `StatsRepository`
- [ ] `OrderService` with business logic and `SignatureVerifier` (off-chain Ed25519 check)
- [ ] All REST routes: `POST/GET/DELETE /orders`, `GET /pairs`, `GET /makers/:address/orders`, `GET /stats`, `GET /health`, `GET /ready`
- [ ] WebSocket feed: `order_created`, `order_filled`, `order_cancelled`, `order_expired` events
- [ ] Background jobs: expiry sweeper (every 60s), stats aggregator (hourly)
- [ ] `openapi.yaml` — OpenAPI 3.1 spec for all endpoints
- [ ] Route tests, service tests, repository tests — all passing

**Completion after day:** 55%

---

### Day 4 Prompts

**Prompt 4.1 — Express app and middleware**
```
Create the orderbook/ workspace for the Soroban Limit Order Protocol order book service.

Stack: Express, TypeScript, Knex (SQLite dev / PostgreSQL prod), Zod, pino, ws.

Create:
- orderbook/src/server.ts — Express app factory (no listen, for testability)
- orderbook/src/app.ts — mounts middleware and routes
- orderbook/src/main.ts — connects DB, starts server, starts background jobs

Middleware stack in order:
1. pino-http request logger
2. express.json() body parser
3. express-rate-limit: 100 req/min per IP for write routes, 300 req/min for reads
4. validateSchema.ts — Zod middleware that validates req.body against a passed schema, returns 400 with validation errors
5. auth.ts — optional API key check for POST/DELETE routes (reads ORDERBOOK_API_KEY env var; if unset, auth is disabled)
6. errorHandler.ts — catches thrown errors, maps known error types to HTTP codes, logs unknown errors

Config:
- orderbook/src/config/index.ts — Zod schema validating all env vars with defaults
- orderbook/src/config/database.ts — Knex factory; uses SQLite for DATABASE_URL=./orderbook.db, PostgreSQL otherwise
```

**Prompt 4.2 — Database schema and migrations**
```
Create the database layer for the orderbook/ service.

schema.sql (canonical DDL, documentation only):
- orders table: id (uuid pk), maker (text), token_in (text), token_out (text),
  amount_in (text), min_amount_out (text), expiry (bigint), nonce (bigint),
  keeper_fee (text), preferred_dex (text nullable), signature (text),
  status (text: pending|filled|cancelled|expired), created_at, updated_at,
  fill_tx_hash (text nullable), fill_price (text nullable), fill_timestamp (bigint nullable)

Migrations using Knex:
- 001_create_orders.ts — creates orders table with indexes on (maker, status), (token_in, token_out, status), (expiry)
- 002_add_pair_index.ts — adds composite index on (token_in, token_out) for pair queries
- 003_add_stats_view.ts — creates a stats view: total_orders, filled_count, fill_rate, volume_24h grouped by pair
- 004_add_fill_metadata.ts — adds fill_tx_hash, fill_price, fill_timestamp columns to orders

Repositories:
- OrderRepository.ts: create(order), findById(id), findByMaker(maker, filters), findPending(pair?),
  updateStatus(id, status, metadata?), delete(id)
- PairRepository.ts: listActivePairs() → [{token_in, token_out, order_count, volume_24h}]
- StatsRepository.ts: getGlobalStats(), getStatsForPair(token_in, token_out)
```

**Prompt 4.3 — Order service and signature verifier**
```
Implement orderbook/src/services/OrderService.ts and SignatureVerifier.ts.

SignatureVerifier.ts:
- Implement verifyOrderSignature(order: OrderPayload, signature: string): boolean
- Reproduce the same canonical order hash algorithm used in the Soroban contract (order.rs)
- Use @stellar/stellar-sdk's Keypair.verify() or tweetnacl to verify the Ed25519 signature
- Return false (do not throw) if the signature is invalid

OrderService.ts:
- submitOrder(payload): validates the order fields (amounts > 0, expiry > now, nonce >= 0,
  valid Stellar addresses), calls SignatureVerifier.verifyOrderSignature(), saves to DB,
  emits order_created event via NotificationService
- getOrder(id): returns order or throws NotFoundError
- listOrders(filters): supports filtering by token_in, token_out, maker, status, with pagination (limit/offset)
- cancelOrder(id, signature): verifies the cancellation is signed by the maker, updates status to cancelled,
  emits order_cancelled event
- markFilled(id, txHash, fillPrice): called by the indexer webhook or admin, updates status + fill metadata

NotificationService.ts:
- Thin wrapper around EventBus that emits typed events
- emit(event: 'order_created' | 'order_filled' | 'order_cancelled' | 'order_expired', payload)
```

**Prompt 4.4 — REST routes and WebSocket feed**
```
Implement the REST routes and WebSocket feed for the orderbook/ service.

Routes (mount on Express router):
- POST /orders — validate body with Zod (OrderSubmitSchema), call OrderService.submitOrder(), return 201 + {id}
- GET /orders — parse query params (token_in, token_out, maker, status, limit, offset), call OrderService.listOrders()
- GET /orders/:id — call OrderService.getOrder(), return 404 if not found
- DELETE /orders/:id — body must contain {signature}, call OrderService.cancelOrder()
- GET /pairs — call PairRepository.listActivePairs()
- GET /makers/:address/orders — shorthand for GET /orders?maker=:address
- GET /stats — call StatsRepository.getGlobalStats()
- GET /health — return 200 {status: "ok", version}
- GET /ready — return 200 if DB connection is alive, 503 otherwise

WebSocket feed (ws/ directory):
- feed.ts: starts a WebSocket server on the same HTTP server
- EventBus.ts: Node.js EventEmitter singleton
- Broadcaster.ts: subscribes to EventBus, fans out JSON messages to all connected WebSocket clients
- subscriptions.ts: clients can send {"subscribe": "token_in/token_out"} to filter events to a specific pair

WebSocket message format must match the README exactly:
  { "event": "order_created", "order": {...} }
  { "event": "order_filled", "order_id": "...", "tx_hash": "..." }
  etc.
```

**Prompt 4.5 — Background jobs and tests**
```
Add background jobs and tests to orderbook/.

Background jobs (orderbook/src/jobs/):
- expiry-sweeper.ts: runs every 60 seconds using setInterval, queries orders WHERE status='pending' AND expiry < now(),
  bulk-updates them to status='expired', emits order_expired events for each
- stats-aggregator.ts: runs every hour, refreshes the materialized stats view (or re-runs aggregation queries
  and writes to a stats cache table)

Tests (orderbook/src/__tests__/):
- routes/orders.test.ts: supertest integration tests for POST, GET, DELETE /orders with valid and invalid payloads
- routes/health.test.ts: GET /health and GET /ready return correct status codes
- services/OrderService.test.ts: unit tests with mocked repository — tests validation, signature rejection,
  duplicate nonce rejection, status transition rules
- services/SignatureVerifier.test.ts: tests with known good and bad signatures generated from the Rust test fixtures
- db/OrderRepository.test.ts: integration tests against a real SQLite test database

All tests must pass with: npm test
```

---

## Day 5 — Keeper Bot

**Goal:** A production-grade keeper bot that polls the order book, checks prices via
RPC simulation, prioritises by keeper fee, executes settlements, and exposes Prometheus metrics.

**Deliverables:**
- [ ] `KeeperEngine.ts` — lifecycle management with graceful shutdown
- [ ] `OrderQueue.ts` — priority queue sorted by `keeper_fee` descending
- [ ] `Watcher.ts` — polling loop with `OrderFetcher`, `PriceChecker`, `ExpiryPruner`
- [ ] `Executor.ts` — `TxBuilder`, `TxSubmitter` (retry + fee bumping), `ResultParser`
- [ ] `Pricer.ts` — aggregates quotes from `SoroswapPricer`, `PhoenixPricer`, `AquariusPricer`
- [ ] `PriceCache.ts` — TTL-based in-memory cache to avoid hammering RPC
- [ ] `MetricsServer.ts` — Prometheus `/metrics` endpoint with order counters and gauges
- [ ] `AlertManager.ts` with Slack webhook integration
- [ ] Full test suite with mocked RPC, order book client, and pricer
- [ ] `Dockerfile` for the keeper service

**Completion after day:** 68%

---

### Day 5 Prompts

**Prompt 5.1 — Keeper engine and order queue**
```
Create the keeper/ workspace for the Soroban Limit Order Protocol keeper bot.

Stack: TypeScript, @stellar/stellar-sdk, pino, zod, node-cron.

config.ts:
- Zod schema validating: KEEPER_SECRET_KEY, RPC_URL, ORDER_BOOK_URL, CONTRACT_ID,
  POLL_INTERVAL_MS (default 5000), MIN_PROFIT_THRESHOLD (default 0.001),
  MAX_CONCURRENT_SETTLEMENTS (default 3), METRICS_PORT (default 9090),
  SLACK_WEBHOOK_URL (optional)

KeeperEngine.ts:
- Class that owns and orchestrates Watcher and Executor
- start(): initialises both, begins polling loop
- stop(): graceful shutdown — waits for in-flight settlements to complete before exiting
- Handles SIGINT and SIGTERM signals

OrderQueue.ts:
- A max-priority-queue (sorted by keeper_fee descending as BigInt)
- enqueue(order): adds to queue if not already present (by order id)
- dequeue(): returns the highest-fee order
- remove(orderId): removes an order (after it's been filled, cancelled, or expired)
- size(): returns current queue depth (exposed as a Prometheus gauge)
```

**Prompt 5.2 — Watcher: fetching orders and checking prices**
```
Implement the watcher/ module inside keeper/src/.

OrderFetcher.ts:
- Fetches pending orders from the order book REST API (GET /orders?status=pending)
- Paginates through all results using limit/offset
- Returns Order[] typed using the same Order type from the SDK
- Handles HTTP errors with exponential backoff retry (3 attempts)

PriceChecker.ts:
- Accepts an Order and a Pricer instance
- isFillable(order): calls Pricer.getBestQuote(order.token_in, order.token_out, order.amount_in - order.keeper_fee)
  and returns true if bestQuote >= order.min_amount_out
- Returns {fillable: boolean, expectedOut: bigint, bestDex: string}

ExpiryPruner.ts:
- Scans the OrderQueue and removes any orders where order.expiry < Date.now() / 1000
- Called at the start of each poll cycle before price checks

Watcher.ts:
- Main polling loop using setInterval(POLL_INTERVAL_MS)
- Each tick: ExpiryPruner.prune() → OrderFetcher.fetch() → for each new order: PriceChecker.isFillable()
  → if fillable: enqueue to OrderQueue
- Emits metrics: orders_fetched_total, orders_pruned_total
```

**Prompt 5.3 — Executor: building and submitting transactions**
```
Implement the executor/ module inside keeper/src/.

TxBuilder.ts:
- Builds a Soroban invokeHostFunction transaction that calls settle(order, signature, dex_address)
- Uses @stellar/stellar-sdk to construct the SorobanOperation
- Simulates the transaction via RPC (simulateTransaction) to get the resource footprint and fee
- Returns a prepared Transaction ready to sign and submit

TxSubmitter.ts:
- Signs the transaction with the keeper keypair
- Submits via RPC sendTransaction
- Polls getTransaction every 2 seconds until status is SUCCESS or FAILED (timeout: 30s)
- On FAILED: if error is fee-related, bump the fee by 25% and retry once
- On network error: exponential backoff up to 3 retries
- Returns {success: boolean, txHash: string, resultXdr?: string}

ResultParser.ts:
- Parses the transaction result XDR to extract:
  - The amount_out received by the maker
  - The keeper_fee earned
  - The DEX used (from contract events)

Executor.ts:
- Dequeues the highest-fee fillable order
- Calls TxBuilder → TxSubmitter → ResultParser
- On success: calls orderbook DELETE /orders/:id to remove the filled order, increments metrics
- On failure: logs the error, re-queues the order with a backoff delay
- Respects MAX_CONCURRENT_SETTLEMENTS to avoid submitting too many txs simultaneously
```

**Prompt 5.4 — Pricer with DEX adapters and cache**
```
Implement the pricer/ module inside keeper/src/.

adapters/SoroswapPricer.ts:
- Uses RPC simulateTransaction to call soroswap_router.get_amounts_out(amount_in, [token_in, token_out])
- Returns the expected output amount as bigint
- Handles simulation errors gracefully (return 0n on failure)

adapters/PhoenixPricer.ts:
- Same pattern using Phoenix pair.simulate_swap(amount_in)

adapters/AquariusPricer.ts:
- Same pattern using Aquarius pool.query_output(token_in, token_out, amount_in)

cache/PriceCache.ts:
- Simple Map<string, {value: bigint, expiresAt: number}>
- get(key): returns cached value if not expired
- set(key, value, ttlMs): stores with TTL (default: 3000ms to avoid stale prices)
- Cache key: "{token_in}:{token_out}:{amount_in}"

Pricer.ts:
- getBestQuote(token_in, token_out, amount_in): queries all three adapters in parallel (Promise.allSettled)
  with PriceCache backing each adapter
- Returns {bestQuote: bigint, bestDex: string, allQuotes: Record<string, bigint>}
- Logs which DEX won and the spread between best and worst
```

**Prompt 5.5 — Metrics, alerts and tests**
```
Add observability and tests to the keeper/.

MetricsServer.ts (using prom-client):
- Expose GET /metrics on METRICS_PORT (default 9090)
- Counters:
  orders_attempted_total — incremented each time Executor tries to settle
  orders_filled_total — incremented on successful settlement
  orders_failed_total — incremented on failed settlement
  orders_expired_total — incremented by ExpiryPruner
- Gauges:
  queue_depth — current OrderQueue.size()
  rpc_latency_ms — rolling average of RPC call duration

AlertManager.ts + Slack.ts:
- AlertManager.alert(severity, message, context): routes to configured channels
- Slack.ts: sends a POST to SLACK_WEBHOOK_URL with a formatted message
- Trigger alerts when: queue_depth > 100, orders_failed_total increases by 5 in 60s,
  keeper account balance < 10 XLM

Tests (keeper/src/__tests__/):
Create mock implementations in mocks/:
- MockRpc.ts: returns configurable simulateTransaction and sendTransaction responses
- MockOrderBookClient.ts: returns configurable pending order lists
- MockPricer.ts: returns configurable quotes per token pair

Write:
- Watcher.test.ts: asserts orders are fetched, expired orders are pruned, fillable orders are enqueued
- Executor.test.ts: asserts TxBuilder is called with correct order data, successful tx increments metrics,
  failed tx re-queues with delay
- Pricer.test.ts: asserts best DEX is selected, cache prevents duplicate RPC calls within TTL
- OrderQueue.test.ts: asserts priority ordering, deduplication, removal

All tests must pass with: npm test
```

---

## Day 6 — TypeScript SDK + Indexer

**Goal:** A published-quality TypeScript SDK that any dApp or bot can use to create,
sign, and submit orders. An indexer service that reads on-chain fill/cancel events
from Horizon and writes them to the database.

**Deliverables:**
- [ ] `OrderBuilder.ts` — fluent builder matching the README usage example exactly
- [ ] `OrderHasher.ts` — canonical hash matching the Rust `order_hash()` function
- [ ] `OrderSigner.ts` — signs hash with Stellar keypair
- [ ] `OrderValidator.ts` — client-side validation before submit
- [ ] `LimitOrderClient.ts`, `OrderBookClient.ts`, `ContractClient.ts`, `WebSocketClient.ts`
- [ ] `PriceQuoter.ts`, `ImpactCalculator.ts`
- [ ] `Simulator.ts`, `ResultDecoder.ts`
- [ ] All SDK types in `types/`
- [ ] Full SDK test suite passing
- [ ] Indexer: `HorizonPoller`, `EventParser`, `CursorStore`, `FillProcessor`, `CancelProcessor`
- [ ] Rollup build producing CJS + ESM + `.d.ts` types

**Completion after day:** 78%

---

### Day 6 Prompts

**Prompt 6.1 — SDK order module**
```
Create the sdk/ workspace for the Soroban Limit Order Protocol.

Build target: CJS + ESM + TypeScript declarations via rollup.config.ts.

types/Order.ts — mirrors the Rust Order struct exactly:
interface Order {
  maker: string;           // Stellar G-address
  tokenIn: string;         // Soroban contract address
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
  expiry: number;          // unix timestamp seconds
  nonce: bigint;
  keeperFee: bigint;
  preferredDex: string | null;
}

types/OrderStatus.ts — union type: "pending" | "filled" | "cancelled" | "expired"
types/Quote.ts — { dex: string; amountOut: bigint; priceImpact: number }
types/Api.ts — request/response types for all order book API endpoints (matching openapi.yaml)

order/OrderHasher.ts:
- hash(order: Order): Buffer
- Must produce the EXACT same bytes as the Rust order_hash() function in contracts/limit_order/src/order.rs
- Serializes fields in this order: maker, token_in, token_out, amount_in, min_amount_out,
  expiry, nonce, keeper_fee, preferred_dex using little-endian encoding for integers
- SHA-256 of the serialized buffer

order/OrderSigner.ts:
- sign(order: Order, keypair: Keypair): string (base64 encoded signature)
- Calls OrderHasher.hash() then keypair.sign(hash)

order/OrderValidator.ts:
- validate(order: Order): { valid: boolean; errors: string[] }
- Checks: amountIn > 0n, minAmountOut > 0n, keeperFee >= 0n, keeperFee < amountIn,
  expiry > Date.now()/1000, nonce >= 0n, valid Stellar G-address for maker,
  valid C-address for tokenIn, tokenOut

order/OrderBuilder.ts:
- Fluent builder: new OrderBuilder().maker(...).tokenIn(...).tokenOut(...)...
- build(): runs OrderValidator, throws if invalid, returns Order
- sign(keypair): returns { order, signature } ready to submit
```

**Prompt 6.2 — SDK client module**
```
Implement the client/ module in sdk/src/.

OrderBookClient.ts:
- Constructor: { baseUrl: string; apiKey?: string }
- submitOrder(order: Order, signature: string): Promise<{ id: string }>
- getOrder(id: string): Promise<OrderWithStatus>
- listOrders(filters: OrderFilters): Promise<PaginatedOrders>
- cancelOrder(id: string, keypair: Keypair): Promise<void> — signs a cancellation payload
- Uses fetch with proper error handling; throws typed SDK errors on 4xx/5xx

ContractClient.ts:
- Constructor: { rpcUrl: string; contractId: string }
- isFilled(maker: string, nonce: bigint): Promise<boolean> — calls is_filled on-chain
- simulateSettlement(order: Order): Promise<bigint> — calls simulate_settlement, decodes result

WebSocketClient.ts:
- Constructor: { wsUrl: string }
- connect(): establishes WebSocket connection
- subscribe(pair?: string): sends subscribe message for a specific token pair
- on(event: 'order_created' | 'order_filled' | 'order_cancelled' | 'order_expired', handler): registers listener
- disconnect(): closes connection cleanly

LimitOrderClient.ts (main entry class, as shown in the README usage example):
- Constructor: { orderBookUrl, rpcUrl, contractId }
- submitOrder(order, signature): delegates to OrderBookClient
- cancelOrder(orderId, keypair): delegates to OrderBookClient
- isFillable(orderId): fetches order then calls ContractClient.simulateSettlement()
- subscribeToFeed(handler): delegates to WebSocketClient
```

**Prompt 6.3 — SDK pricing, simulation and tests**
```
Implement pricing and simulation in sdk/src/ and the full test suite.

simulation/Simulator.ts:
- simulateTransaction(rpcUrl, tx): wraps @stellar/stellar-sdk simulateTransaction RPC call
- Returns raw SimulateTransactionResponse

simulation/ResultDecoder.ts:
- decodeSimulationResult(response): extracts the i128 return value from XDR
- Handles error responses with a typed SimulationError

pricing/PriceQuoter.ts:
- getQuote(rpcUrl, dexContractId, tokenIn, tokenOut, amountIn): builds a simulateTransaction
  call to the DEX contract's get_quote / get_amounts_out function, returns Quote
- Supports Soroswap and Phoenix interfaces (auto-detect by trying both)

pricing/ImpactCalculator.ts:
- calculatePriceImpact(spotPrice: bigint, effectivePrice: bigint): number (as percentage)
- calculateMinAmountOut(amountIn: bigint, targetPrice: bigint, slippageBps: number): bigint

utils/amounts.ts: toBaseUnits(amount: string, decimals: number): bigint, fromBaseUnits(amount: bigint, decimals: number): string
utils/price.ts: priceToMinAmountOut, minAmountOutToPrice
utils/time.ts: nowPlusSeconds(s: number): number, isExpired(expiry: number): boolean
utils/address.ts: isValidStellarAddress(addr: string): boolean, isValidContractAddress(addr: string): boolean
utils/errors.ts: SdkError, ValidationError, NetworkError, ContractError classes

Tests (sdk/src/__tests__/):
- OrderHasher.test.ts: assert hash output matches known vector produced by the Rust test fixtures
- OrderSigner.test.ts: sign an order, verify the signature using tweetnacl directly
- OrderBuilder.test.ts: test fluent builder, validation errors, happy path
- LimitOrderClient.test.ts: mock fetch, assert correct API calls are made
- PriceQuoter.test.ts: mock RPC simulation, assert correct quote extraction
- amounts.test.ts: toBaseUnits / fromBaseUnits round-trip tests for common decimal values

All tests must pass with: npm test
```

**Prompt 6.4 — Indexer service**
```
Create the indexer/ workspace for the Soroban Limit Order Protocol.

The indexer reads on-chain events emitted by the settlement contract and writes fill/cancel
records to the order book database.

horizon/HorizonPoller.ts:
- Polls Horizon GET /accounts/:contractId/transactions or uses the /effects endpoint
- On each new ledger: fetches all contract events for the settlement contract address
- Uses cursor-based pagination to avoid re-processing events
- Emits raw event objects to EventParser

horizon/EventParser.ts:
- Decodes Soroban contract events from base64 XDR
- Identifies event type from the topics array ("order_filled", "order_cancelled", "order_expired")
- Returns strongly-typed ParsedFillEvent | ParsedCancelEvent | ParsedExpireEvent

horizon/CursorStore.ts:
- Persists the last successfully processed Horizon cursor to DB (indexer_cursor table)
- load(): returns last cursor or "now" for first run
- save(cursor): updates the stored cursor

processors/FillProcessor.ts:
- Handles ParsedFillEvent
- Calls orderbook service's internal markFilled(orderId, txHash, fillPrice)
- If order not found in DB (edge case): logs a warning and skips

processors/CancelProcessor.ts:
- Handles ParsedCancelEvent, calls orderbook to mark order as cancelled

processors/ExpireProcessor.ts:
- Handles ParsedExpireEvent, marks order as expired in DB

Tests:
- EventParser.test.ts: decodes known base64 XDR event fixtures into correct typed events
- FillProcessor.test.ts: mocked DB, asserts markFilled is called with correct args
```

---

## Day 7 — Frontend Core + CI/CD + Integration Hardening

**Goal:** A functional Next.js frontend covering the core trading flow, complete GitHub Actions
CI pipeline, all environment docs finalized, and end-to-end smoke tests passing.

**Deliverables:**
- [ ] Next.js 14 App Router app with Tailwind CSS and shadcn/ui primitives
- [ ] `WalletProvider` + `useWallet` hook (Freighter integration)
- [ ] `OrderForm.tsx` + `OrderTypeSelector.tsx` + `SubmitButton.tsx` (full place-order flow)
- [ ] `OrdersTable.tsx` + `CancelButton.tsx` (open orders management)
- [ ] `PriceChart.tsx` using TradingView lightweight-charts
- [ ] `usePrice`, `useOrders`, `usePlaceOrder`, `useCancelOrder` hooks
- [ ] Zustand stores: `orderStore`, `walletStore`, `settingsStore`
- [ ] `.github/workflows/ci.yml` — test all workspaces on every PR
- [ ] `.github/workflows/deploy-testnet.yml` — auto-deploy on merge to `main`
- [ ] `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`
- [ ] `scripts/deploy.sh`, `scripts/smoke-test.sh`
- [ ] README badges updated with accurate build status links

**Completion after day:** 85%

---

### Day 7 Prompts

**Prompt 7.1 — Next.js app scaffold and wallet integration**
```
Create the frontend/ workspace for the Soroban Limit Order Protocol.

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, pino.

Setup:
- next.config.ts: configure transpilePackages for @soroban-limit-orders/sdk
- tailwind.config.ts: extend theme with brand colors (stellar purple, dark background)
- src/app/layout.tsx: root layout wrapping with WalletProvider, QueryProvider, OrderBookProvider, ToastProvider
- src/app/page.tsx: hero landing page with a "Launch App" CTA button linking to /trade

WalletProvider and useWallet:
- frontend/src/providers/WalletProvider.tsx: React context that holds { publicKey, isConnected, connect, disconnect }
- frontend/src/hooks/useWallet.ts: consumes context, exposes connect() which calls @stellar/freighter-api
  getPublicKey(), and signTransaction(xdr)
- frontend/src/stores/walletStore.ts: Zustand store persisting wallet connection state to localStorage
- frontend/src/components/wallet/ConnectWallet.tsx: button that opens WalletModal on click
- frontend/src/components/wallet/WalletModal.tsx: modal with "Connect Freighter" button
- frontend/src/components/wallet/AccountBadge.tsx: shows truncated G-address when connected

ui/ primitives (use shadcn/ui as base):
- Button.tsx, Input.tsx, Select.tsx, Modal.tsx, Tooltip.tsx, Spinner.tsx, Toast.tsx, Table.tsx
```

**Prompt 7.2 — Trade page and order placement**
```
Implement the trading interface for the Soroban Limit Order Protocol frontend.

src/app/trade/page.tsx:
- Two-column layout: left = OrderForm, right = PriceChart
- Reads [pair] from URL param to pre-fill token pair if present

src/components/trade/OrderTypeSelector.tsx:
- Tab bar with four tabs: Limit Buy | Limit Sell | Stop Loss | Take Profit
- Stores selected type in orderStore

src/components/trade/OrderForm.tsx:
- Uses OrderTypeSelector at the top
- Fields: token pair selector (from constants.ts token list), amount input, target price input,
  keeper fee slider (0.01%–1% of amount), expiry picker (1h / 4h / 24h / 7d / custom)
- Below fields: OrderPreview showing estimated output, price impact, keeper fee in USD
- SubmitButton at the bottom

src/components/trade/SubmitButton.tsx:
- Disabled when wallet not connected (shows "Connect Wallet" instead)
- On click: calls usePlaceOrder hook
- Shows Spinner during submission, success toast on fill, error toast on failure

src/hooks/usePlaceOrder.ts:
- Takes OrderFormValues as input
- Uses OrderBuilder from the SDK to construct the order
- Calls useWallet().signTransaction() — but for orders, uses Freighter's signBlob() to sign the hash
- Submits to order book via SDK LimitOrderClient
- Invalidates the useOrders() query cache on success

src/hooks/usePrice.ts:
- Polls PriceQuoter from the SDK every 5 seconds for the current spot price of the selected pair
- Returns { price: bigint; loading: boolean; error: Error | null }
```

**Prompt 7.3 — Orders table, history page and price chart**
```
Implement the orders and history pages for the frontend.

src/app/orders/page.tsx:
- Header: "Open Orders" + count badge
- Renders OrdersTable with live data from useOrders()

src/components/orders/OrdersTable.tsx:
- Columns: Pair | Type | Amount | Target Price | Min Out | Keeper Fee | Expiry | Status | Actions
- Subscribes to WebSocket feed via useOrderBook() — updates rows in real-time on fill/cancel events
- Pagination: 20 rows per page

src/components/orders/OrderRow.tsx:
- Renders a single row
- Status shown via OrderStatusBadge (colour-coded: yellow=pending, green=filled, red=cancelled, grey=expired)
- CancelButton shown only for pending orders belonging to the connected wallet

src/components/orders/CancelButton.tsx:
- On click: calls useCancelOrder() hook
- Shows confirmation modal before cancelling
- Signs the cancellation via useWallet().signBlob()

src/app/history/page.tsx:
- Shows filled + cancelled + expired orders for the connected wallet
- Renders HistoryTable with columns: Pair | Type | Amount In | Amount Out | Fill Price | Tx Hash | Date
- ExportCsvButton exports the visible rows as CSV

src/components/chart/PriceChart.tsx:
- Uses TradingView lightweight-charts (npm install lightweight-charts)
- Renders a candlestick or line chart for the selected token pair
- Fetches OHLCV data from Horizon (aggregated from fill events)
- OrderLinesOverlay.tsx draws horizontal dashed lines for the user's open orders on the chart
```

**Prompt 7.4 — GitHub Actions CI/CD pipelines**
```
Create the CI/CD pipelines for the Soroban Limit Order Protocol.

.github/workflows/ci.yml:
Trigger: pull_request to main, push to main
Jobs (run in parallel where possible):
1. contract-test:
   - uses: rust toolchain from rust-toolchain.toml
   - steps: cargo fmt --check, cargo clippy -- -D warnings, cargo test
2. orderbook-test:
   - uses: node 20
   - steps: cd orderbook && npm ci && npm run lint && npm test
3. keeper-test:
   - uses: node 20
   - steps: cd keeper && npm ci && npm run lint && npm test
4. sdk-test:
   - uses: node 20
   - steps: cd sdk && npm ci && npm run lint && npm test
5. frontend-build:
   - uses: node 20
   - steps: cd frontend && npm ci && npm run lint && npm run build

.github/workflows/deploy-testnet.yml:
Trigger: push to main (after ci passes)
Steps:
1. Build contract WASM
2. Deploy contract using soroban CLI with TESTNET_DEPLOYER_SECRET from GitHub secrets
3. Save new CONTRACT_ID to GitHub environment
4. Build and push Docker images for orderbook, keeper, indexer to GitHub Container Registry
5. Deploy frontend to Vercel (using VERCEL_TOKEN secret)

.github/workflows/audit.yml:
Trigger: schedule every Monday 09:00 UTC
Steps: cargo audit, npm audit --workspaces
Opens a GitHub issue if vulnerabilities are found.

Also create:
- .github/PULL_REQUEST_TEMPLATE.md with sections: Summary, Changes, Testing, Checklist
- .github/ISSUE_TEMPLATE/bug_report.md and feature_request.md
- .github/dependabot.yml enabling weekly dependency updates for npm and cargo
```

**Prompt 7.5 — Contributing docs, scripts and final hardening**
```
Finalize the Soroban Limit Order Protocol repository for contributors.

CONTRIBUTING.md:
- Development setup (prerequisites, clone, install, build contract, run docker-compose)
- How to run tests for each workspace
- Commit message format (Conventional Commits: feat:, fix:, docs:, test:, chore:)
- Branch naming convention: feat/, fix/, docs/, chore/
- PR process: open draft first, request review when ready, squash merge only
- Code style: cargo fmt + clippy for Rust, eslint + prettier for TypeScript
- How to add a new DEX adapter (both Rust contract side and TypeScript keeper pricer side)

SECURITY.md:
- Responsible disclosure policy: email security@yourdomain.com, 90-day disclosure window
- Scope: settlement contract, keeper bot, order book service
- Out of scope: frontend cosmetic issues, third-party DEX vulnerabilities
- Reward: public acknowledgement in CHANGELOG

scripts/deploy.sh:
- Builds the WASM, runs soroban contract deploy, outputs the contract ID
- Accepts --network testnet|mainnet as argument
- Validates that required env vars are set before deploying
- Appends CONTRACT_ID=<new_id> to .env automatically

scripts/smoke-test.sh:
- Places one test limit order via the SDK CLI
- Waits up to 30 seconds for the keeper to fill it
- Asserts the order status is "filled" in the order book
- Prints pass/fail and cleans up the test order

Update README.md badges to point to the actual CI workflow URLs.
Create CHANGELOG.md with an initial 0.1.0 entry describing the Phase 1 core protocol completion.
```

---

## What 85% Completion Covers

By the end of Day 7, the repository will have:

| Component | Status |
|-----------|--------|
| Soroban settlement contract | ✅ Complete |
| Order struct + signature verification | ✅ Complete |
| Nonce / replay protection | ✅ Complete |
| Cancellation (single + batch) | ✅ Complete |
| Contract events | ✅ Complete |
| DEX adapters (mock + interface) | ✅ Complete |
| Multi-DEX router | ✅ Complete |
| Contract integration tests | ✅ Complete |
| Fuzz test targets | ✅ Complete |
| Order book service (REST + WS) | ✅ Complete |
| Database schema + migrations | ✅ Complete |
| Background jobs | ✅ Complete |
| Keeper bot (watcher + executor) | ✅ Complete |
| Pricer (all 3 DEX adapters) | ✅ Complete |
| Prometheus metrics + Slack alerts | ✅ Complete |
| TypeScript SDK | ✅ Complete |
| Indexer service | ✅ Complete |
| Frontend (trade + orders + history) | ✅ Core complete |
| Wallet integration (Freighter) | ✅ Complete |
| GitHub Actions CI/CD | ✅ Complete |
| Deploy + smoke-test scripts | ✅ Complete |
| Contributing + security docs | ✅ Complete |

## Remaining 15% (Post-Sprint)

| Item | Notes |
|------|-------|
| Professional security audit | Blocked until mainnet approach |
| Production DEX contract addresses | Need live Soroswap/Phoenix mainnet contracts |
| Full Playwright E2E suite | Requires funded testnet wallet in CI |
| Terraform infrastructure | Cloud provider decision needed |
| Grafana dashboards | Requires running Prometheus instance |
| Analytics page | Low priority, no blocking dependencies |
| Keeper leaderboard page | Needs indexer fill data accumulation |
| TWAP / DCA order types | Phase 5 — post-audit |
| xBull wallet support | Additive, non-breaking |
| Mobile responsive polish | CSS-only, non-blocking |

---

> This plan is aligned with the README.md roadmap. Days 1–3 complete Phase 1, Days 4–5
> complete Phase 2 infrastructure, Days 6–7 begin Phase 3. No feature in this plan
> deviates from the architecture or order types defined in the README.