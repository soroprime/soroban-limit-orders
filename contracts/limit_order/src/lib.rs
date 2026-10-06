#![no_std]

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Vec, contractclient};

mod cancellation;
pub mod events;
mod errors;
mod fee;
mod order;
mod settlement;
mod signature;
mod storage;
mod token;

pub use crate::errors::ContractError;
pub use crate::events::{OrderCancelledEvent, OrderExpiredEvent, OrderFilledEvent};
pub use crate::order::{order_hash, Order, OrderType};

#[contractclient(name = "Client")]
pub trait LimitOrderTrait {
    fn settle(env: Env, order: Order, signature: BytesN<64>, dex_address: Address) -> Result<i128, ContractError>;
    fn cancel(env: Env, maker: Address, nonce: u64) -> Result<(), ContractError>;
    fn batch_cancel(env: Env, maker: Address, nonces: Vec<u64>) -> Result<(), ContractError>;
    fn is_filled(env: Env, maker: Address, nonce: u64) -> bool;
    fn is_cancelled(env: Env, maker: Address, nonce: u64) -> bool;
    fn simulate_settlement(env: Env, order: Order) -> Result<i128, ContractError>;
}

#[contract]
pub struct LimitOrder;

#[contractimpl]
impl LimitOrder {
    pub fn settle(env: Env, order: Order, signature: BytesN<64>, dex_address: Address) -> Result<i128, ContractError> {
        settlement::settle(env, order, signature, dex_address)
    }

    pub fn cancel(env: Env, maker: Address, nonce: u64) -> Result<(), ContractError> {
        cancellation::cancel(env, maker, nonce)
    }

    pub fn batch_cancel(env: Env, maker: Address, nonces: Vec<u64>) -> Result<(), ContractError> {
        cancellation::batch_cancel(env, maker, nonces)
    }

    pub fn is_filled(env: Env, maker: Address, nonce: u64) -> bool {
        storage::is_filled(&env, &maker, nonce)
    }

    pub fn is_cancelled(env: Env, maker: Address, nonce: u64) -> bool {
        storage::is_cancelled(&env, &maker, nonce)
    }

    pub fn simulate_settlement(env: Env, order: Order) -> Result<i128, ContractError> {
        settlement::simulate_settlement(env, order)
    }
}