# Contributing to Soroban Limit Order Protocol

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

### Prerequisites

- Node.js >= 20
- Rust >= 1.75 (with `wasm32v1-none` target)
- Stellar CLI (`stellar`)
- Docker & Docker Compose (for local development)
- pnpm (for monorepo management)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/soroban-limit-orders.git
cd soroban-limit-orders

# Install dependencies
pnpm install

# Build the Soroban contract
cd contracts && stellar contract build

# Start local development environment
docker-compose up -d
```

### Running Tests

```bash
# All workspaces
pnpm test

# Individual workspaces
cd contracts && cargo test
cd ../orderbook && npm test
cd ../keeper && npm test
cd ../sdk && npm test
cd ../indexer && npm test
cd ../frontend && npm test
```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks
- `refactor`: Code refactoring
- `perf`: Performance improvements

Examples:
```
feat(orderbook): add WebSocket subscription filtering
fix(keeper): handle RPC timeout gracefully
docs(sdk): update OrderBuilder usage example
```

## Branch Naming Convention

- `feat/<short-description>` - New features
- `fix/<short-description>` - Bug fixes
- `docs/<short-description>` - Documentation updates
- `chore/<short-description>` - Maintenance tasks

## Pull Request Process

1. Open a draft PR first for early feedback
2. Request review when ready
3. Ensure all CI checks pass
4. Squash and merge only (no merge commits)
5. Delete branch after merge

## Code Style

### Rust (Contracts)
```bash
cargo fmt --all
cargo clippy --all-targets --all-features -- -D warnings
```

### TypeScript (All other workspaces)
```bash
npm run lint
npm run build
```

## Adding a New DEX Adapter

### Rust Contract Side

1. Create new adapter in `contracts/limit_order/src/dex/<dex_name>.rs`
2. Implement the `DexAdapter` trait
3. Register in `contracts/limit_order/src/dex/mod.rs`
4. Update `router.rs` to dispatch to new adapter
5. Add integration tests

### TypeScript Keeper Side

1. Create new pricer in `keeper/src/pricer/adapters/<DexName>Pricer.ts`
2. Implement quote fetching via RPC simulation
3. Register in `keeper/src/pricer/Pricer.ts`
4. Add tests in `keeper/src/__tests__/Pricer.test.ts`

## Reporting Issues

- Use the bug report template for bugs
- Use the feature request template for new features
- Search existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.