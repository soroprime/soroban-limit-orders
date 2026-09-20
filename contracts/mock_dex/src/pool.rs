//! Mock DEX pool with a configurable exchange rate.
//!
//! Used only by integration tests to simulate Soroswap, Phoenix and Aquarius
//! without hitting live contracts. The rate encodes `token_in -> token_out`
//! with 6 decimal precision (e.g. rate `1_000_000` = 1:1).

use soroban_sdk::{contracttype, Address, Env};

/// Decimal precision of stored exchange rates.
pub const SCALE: i128 = 1_000_000;

/// Storage keys for the mock DEX.
#[contracttype]
pub enum DataKey {
    /// Contract admin that may set prices.
    Admin,
    /// Exchange rate for a (token_in, token_out) pair.
    Rate(Address, Address),
}

/// Stores the admin set at deployment time.
pub fn init(env: &Env, admin: &Address) {
    env.storage().persistent().set(&DataKey::Admin, admin);
}

/// Returns the stored admin, panicking if the contract was not initialised.
pub fn admin(env: &Env) -> Address {
    env.storage()
        .persistent()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| {
            panic!("mock_dex: contract not initialised — call init() first")
        })
}

/// Sets the exchange rate for a pair. Only callable by the contract admin.
pub fn set_price(env: &Env, token_in: &Address, token_out: &Address, rate: i128) {
    let owner = admin(env);
    owner.require_auth();
    if token_in == token_out {
        panic!("mock_dex: token_in and token_out must differ");
    }
    env.storage()
        .persistent()
        .set(&DataKey::Rate(token_in.clone(), token_out.clone()), &rate);
}

/// The stored rate for a pair, panicking with a descriptive message if unset.
pub fn rate(env: &Env, token_in: &Address, token_out: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Rate(token_in.clone(), token_out.clone()))
        .unwrap_or_else(|| panic!("mock_dex: no rate set for the pair"))
}

fn quote(env: &Env, token_in: &Address, token_out: &Address, amount_in: i128) -> i128 {
    if amount_in < 0 {
        panic!("mock_dex: amount_in must be non-negative");
    }
    amount_in * rate(env, token_in, token_out) / SCALE
}

/// Simulated swap: returns `amount_in * rate / SCALE`. No state change.
pub fn swap(env: &Env, token_in: &Address, token_out: &Address, amount_in: i128) -> i128 {
    quote(env, token_in, token_out, amount_in)
}

/// Same calculation as [`swap`], explicitly read-only.
pub fn get_quote(env: &Env, token_in: &Address, token_out: &Address, amount_in: i128) -> i128 {
    quote(env, token_in, token_out, amount_in)
}