#!/bin/bash
# Deploy script for Soroban Limit Order Protocol

set -euo pipefail

NETWORK="${1:-testnet}"
CONTRACT_DIR="contracts"

echo "Deploying to $NETWORK..."

# Validate environment
if [[ "$NETWORK" == "mainnet" ]]; then
  if [[ -z "${MAINNET_DEPLOYER_SECRET:-}" ]]; then
    echo "ERROR: MAINNET_DEPLOYER_SECRET not set"
    exit 1
  fi
  NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
  RPC_URL="https://soroban-mainnet.stellar.org"
else
  if [[ -z "${TESTNET_DEPLOYER_SECRET:-}" ]]; then
    echo "ERROR: TESTNET_DEPLOYER_SECRET not set"
    exit 1
  fi
  NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  RPC_URL="https://soroban-testnet.stellar.org"
fi

# Build contract
echo "Building contract..."
cd "$CONTRACT_DIR"
stellar contract build

# Find WASM
WASM_PATH=$(find target/wasm32v1-none/release -name "*.wasm" | head -1)
if [[ -z "$WASM_PATH" ]]; then
  echo "ERROR: WASM not found"
  exit 1
fi

echo "Deploying $WASM_PATH..."

# Deploy
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source deployer \
  --network "$NETWORK" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  --rpc-url "$RPC_URL")

echo "Contract deployed: $CONTRACT_ID"

# Update .env
if [[ -f "../.env" ]]; then
  if grep -q "^CONTRACT_ID=" ../.env; then
    sed -i "s/^CONTRACT_ID=.*/CONTRACT_ID=$CONTRACT_ID/" ../.env
  else
    echo "CONTRACT_ID=$CONTRACT_ID" >> ../.env
  fi
  echo "Updated .env with CONTRACT_ID=$CONTRACT_ID"
else
  echo "CONTRACT_ID=$CONTRACT_ID" > ../.env
  echo "Created .env with CONTRACT_ID=$CONTRACT_ID"
fi

# Initialize contract (if needed)
echo "Initializing contract..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source deployer \
  --network "$NETWORK" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  --rpc-url "$RPC_URL" \
  -- initialize \
  --admin "$(stellar keys address deployer)"

echo "Deployment complete!"
echo "Contract ID: $CONTRACT_ID"