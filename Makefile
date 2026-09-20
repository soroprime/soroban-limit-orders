.PHONY: build test lint dev install contract contract-test format clean

# Top-level development shortcuts for the Soroban Limit Order Protocol monorepo
# Forwarded to the Turborepo pipeline (see turbo.json).

build:
	@pnpm turbo run build

test:
	@pnpm turbo run test

lint:
	@pnpm turbo run lint

dev:
	@docker-compose up --build

install:
	@pnpm install

contract: # Build the Soroban settlement contract to WASM
	@cd contracts && cargo build --target wasm32v1-none --release

contract-test: # Run the Soroban contract test-suite
	@cd contracts && cargo test

format:
	@pnpm prettier --write "**/*.{ts,tsx,js,json,md}" "!frontend/**"

clean:
	@pnpm turbo run clean
	@cd contracts && cargo clean