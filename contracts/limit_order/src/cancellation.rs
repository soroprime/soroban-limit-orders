use soroban_sdk::{Address, Env, Vec};

use crate::{ContractError, events, storage};

pub fn cancel(env: Env, maker: Address, nonce: u64) -> Result<(), ContractError> {
    maker.require_auth();

    if storage::is_used(&env, &maker, nonce) {
        return Err(ContractError::OrderAlreadyFilled);
    }

    storage::mark_cancelled(&env, &maker, nonce);

    events::emit_order_cancelled(&env, &maker, nonce);

    Ok(())
}

pub fn batch_cancel(env: Env, maker: Address, nonces: Vec<u64>) -> Result<(), ContractError> {
    maker.require_auth();

    if nonces.len() > 10 {
        return Err(ContractError::InvalidNonce);
    }

    for nonce in nonces.iter() {
        if !storage::is_used(&env, &maker, nonce) {
            storage::mark_cancelled(&env, &maker, nonce);
            events::emit_order_cancelled(&env, &maker, nonce);
        }
    }

    Ok(())
}