//! DEX adapter trait and cross-contract call helpers.
//!
//! Each adapter translates the generic `swap` / `get_quote` interface into the
//! specific ABI of a supported DEX (Soroswap, Phoenix, Aquarius).  The
//! settlement contract calls adapters through the `DexAdapter` trait so that
//! new DEXes can be added without touching the core settlement logic.

use soroban_sdk::{Address, Env};

/// Common interface implemented by every DEX adapter.
pub trait DexAdapter {
    /// Return the expected output amount for swapping `amount_in` of
    /// `token_in` for `token_out` without executing any state change.
    fn get_quote(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
    ) -> i128;

    /// Execute the swap and return the actual output amount.
    ///
    /// The `min_out` parameter is forwarded to the DEX so that it can revert
    /// if price has moved since the quote was taken.
    fn swap(
        env: &Env,
        dex: &Address,
        token_in: &Address,
        token_out: &Address,
        amount_in: i128,
        min_out: i128,
    ) -> i128;
}

// Re-export adapters for use in router.rs.
pub mod soroswap;
pub mod phoenix;
pub mod aquarius;
