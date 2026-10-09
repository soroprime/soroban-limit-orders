//! Soroswap v2 router adapter.
//!
//! In production this talks to the deployed Soroswap router contract.  In the
//! test environment the router address points to the `mock_dex` contract whose
//! `swap` / `get_quote` ABI is a compatible subset, so no special test path is
//! needed.

use soroban_sdk::{contractclient, Address, Env, Vec};

use super::DexAdapter;

// ---------------------------------------------------------------------------
// Cross-contract client
// ---------------------------------------------------------------------------

/// Minimal Soroswap router interface used by this adapter.
///
/// On testnet the mock DEX exposes `swap(token_in, token_out, amount_in)`
/// which matches the signature below, so tests can substitute the mock
/// address as the router address without any branching code.
#[contractclient(name = "SoroswapClient")]
trait SoroswapRouter {
    /// Execute an exact-input swap along `path` and return the output amount.
    fn swap(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;

    /// Return the expected output for swapping `amount_in` of `path[0]`
    /// through the pool to `path[last]`.
    fn get_quote(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

/// Adapter for the Soroswap v2 router.
pub struct SoroswapAdapter;

impl DexAdapter for SoroswapAdapter {
    fn get_quote(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
    ) -> i128 {
        SoroswapClient::new(env, dex).get_quote(token_in, token_out, &amount_in)
    }

    fn swap(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
        _min_out: i128,
    ) -> i128 {
        SoroswapClient::new(env, dex).swap(token_in, token_out, &amount_in)
    }
}
