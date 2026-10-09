//! Multi-DEX best-price router.
//!
//! `find_best_dex` queries every available DEX and returns the one that
//! produces the highest output for a given order.  If the order specifies a
//! `preferred_dex`, that DEX is used directly without sampling alternatives.
//!
//! `route_swap` executes the winning swap via the generic cross-contract
//! client that all three adapters share (since the mock DEX and the real
//! adapters expose the same `swap` / `get_quote` ABI).

use soroban_sdk::{contractclient, Address, Env};

use crate::order::Order;

// ---------------------------------------------------------------------------
// Generic cross-contract client shared by all adapters in the router.
// ---------------------------------------------------------------------------

/// Minimal DEX interface that every supported DEX (and the mock DEX) exposes.
/// The router uses this single client so it does not need to know which
/// concrete DEX sits behind a given address.
#[contractclient(name = "RouterDexClient")]
trait RouterDex {
    fn get_quote(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;
    fn swap(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Query every DEX in `available_dexes` and return the address that yields
/// the highest output for the given swap parameters.
///
/// If `order.preferred_dex` is `Some(addr)`, that address is returned
/// immediately without consulting `available_dexes`.
///
/// # Panics
/// Panics if `available_dexes` is empty and `order.preferred_dex` is `None`.
pub fn find_best_dex(
    env: &Env,
    order: &Order,
    swap_amount: i128,
    available_dexes: &[Address],
) -> (Address, i128) {
    // Honour `preferred_dex` — skip price discovery entirely.
    if let Some(preferred) = &order.preferred_dex {
        let quote =
            RouterDexClient::new(env, preferred).get_quote(&order.token_in, &order.token_out, &swap_amount);
        return (preferred.clone(), quote);
    }

    // Sample every DEX and pick the best output.
    let mut best_dex: Option<Address> = None;
    let mut best_quote: i128 = -1;

    for dex in available_dexes {
        let quote =
            RouterDexClient::new(env, dex).get_quote(&order.token_in, &order.token_out, &swap_amount);
        if quote > best_quote {
            best_quote = quote;
            best_dex = Some(dex.clone());
        }
    }

    match best_dex {
        Some(dex) => (dex, best_quote),
        None => panic!("router: no DEX addresses provided"),
    }
}

/// Execute the swap on `dex_address` and return the actual output amount.
pub fn route_swap(
    env: &Env,
    dex_address: &Address,
    token_in: &Address,
    token_out: &Address,
    swap_amount: i128,
) -> i128 {
    RouterDexClient::new(env, dex_address).swap(token_in, token_out, &swap_amount)
}
