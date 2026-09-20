#![no_std]

//! Mock DEX contract.
//!
//! A minimal DEX used only by integration tests. It stores a configurable
//! exchange rate per (token_in, token_out) pair and simulates swaps without
//! moving any tokens.

mod pool;

use soroban_sdk::{contract, contractimpl, Address, Env};

pub use crate::pool::DataKey;

/// The mock DEX contract.
#[contract]
pub struct MockDex;

#[contractimpl]
impl MockDex {
    /// Store the contract admin (must be called once at deploy time).
    pub fn init(env: Env, admin: Address) {
        pool::init(&env, &admin);
    }

    /// Set the exchange rate for a pair. Only callable by the contract admin.
    pub fn set_price(env: Env, token_in: Address, token_out: Address, rate: i128) {
        pool::set_price(&env, &token_in, &token_out, rate);
    }

    /// Simulated swap of `token_in -> token_out`, returning the output amount.
    ///
    /// Panics with a descriptive error when no rate is set for the pair.
    pub fn swap(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128 {
        pool::swap(&env, &token_in, &token_out, amount_in)
    }

    /// Quote-only variant of [`swap`] — same calculation, no state change.
    pub fn get_quote(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128 {
        pool::get_quote(&env, &token_in, &token_out, amount_in)
    }
}