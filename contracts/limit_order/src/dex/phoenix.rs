//! Phoenix DEX pair adapter.
//!
//! In production this talks to a deployed Phoenix pair contract.  In tests the
//! mock DEX exposes the same `swap` / `get_quote` interface, so the mock
//! address can be passed in place of a real Phoenix pair.

use soroban_sdk::{contractclient, Address, Env};

use super::DexAdapter;

// ---------------------------------------------------------------------------
// Cross-contract client
// ---------------------------------------------------------------------------

/// Minimal Phoenix pair interface used by this adapter.
#[contractclient(name = "PhoenixClient")]
trait PhoenixPair {
    /// Execute a swap of `amount_in` of `token_in` for `token_out` and return
    /// the output amount.
    fn swap(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;

    /// Read-only simulation of `swap`.
    fn get_quote(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/// Adapter for Phoenix DEX pair contracts.
pub struct PhoenixAdapter;

impl DexAdapter for PhoenixAdapter {
    fn get_quote(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
    ) -> i128 {
        PhoenixClient::new(env, dex).get_quote(token_in, token_out, &amount_in)
    }

    fn swap(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
        _min_out: i128,
    ) -> i128 {
        PhoenixClient::new(env, dex).swap(token_in, token_out, &amount_in)
    }
}
