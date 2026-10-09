//! Aquarius AMM adapter.
//!
//! In production this talks to a deployed Aquarius pool contract.  In tests
//! the mock DEX exposes the same `swap` / `get_quote` interface, so the mock
//! address can be substituted directly.

use soroban_sdk::{contractclient, Address, Env};

use super::DexAdapter;

// ---------------------------------------------------------------------------
// Cross-contract client
// ---------------------------------------------------------------------------

/// Minimal Aquarius pool interface used by this adapter.
#[contractclient(name = "AquariusClient")]
trait AquariusPool {
    /// Execute a swap of `amount_in` of `token_in` for `token_out` and return
    /// the output amount.
    fn swap(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;

    /// Read-only quote for the swap.
    fn get_quote(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/// Adapter for Aquarius AMM pool contracts.
pub struct AquariusAdapter;

impl DexAdapter for AquariusAdapter {
    fn get_quote(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
    ) -> i128 {
        AquariusClient::new(env, dex).get_quote(token_in, token_out, &amount_in)
    }

    fn swap(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
        _min_out: i128,
    ) -> i128 {
        AquariusClient::new(env, dex).swap(token_in, token_out, &amount_in)
    }
}
