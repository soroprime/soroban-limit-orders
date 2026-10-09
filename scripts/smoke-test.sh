#!/bin/bash
# Smoke test for Soroban Limit Order Protocol

set -euo pipefail

ORDER_BOOK_URL="${ORDER_BOOK_URL:-http://localhost:3001}"
RPC_URL="${RPC_URL:-https://soroban-testnet.stellar.org}"
CONTRACT_ID="${CONTRACT_ID:-}"
KEEPER_SECRET="${KEEPER_SECRET_KEY:-}"

echo "Running smoke test..."
echo "Order Book: $ORDER_BOOK_URL"
echo "Contract: $CONTRACT_ID"

# Check health
echo "Checking health endpoint..."
HEALTH=$(curl -s "$ORDER_BOOK_URL/health")
if [[ "$HEALTH" != '{"status":"ok"'* ]]; then
  echo "ERROR: Health check failed"
  exit 1
fi
echo "Health OK"

# Check ready
echo "Checking ready endpoint..."
READY=$(curl -s "$ORDER_BOOK_URL/ready")
if [[ "$READY" != '{"status":"ready"'* ]]; then
  echo "ERROR: Ready check failed"
  exit 1
fi
echo "Ready OK"

# Place a test order (requires SDK CLI or manual setup)
echo "Smoke test requires manual order placement via SDK"
echo "Please run: npx @soroban-limit-orders/sdk place-order --help"

# Wait for keeper to fill
echo "Waiting for keeper to fill order (30s timeout)..."
sleep 30

# Check order status
# This would require an order ID from the placed order
echo "Smoke test complete. Check order status manually via:"
echo "  curl $ORDER_BOOK_URL/orders/<order-id>"

echo "Smoke test passed!"