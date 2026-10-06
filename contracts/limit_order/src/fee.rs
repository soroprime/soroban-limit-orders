use soroban_sdk::{Address, Env};

use crate::ContractError;
use crate::token::Client as TokenClient;

pub fn deduct_keeper_fee(amount_in: i128, keeper_fee: i128) -> Result<i128, ContractError> {
    if keeper_fee < 0 {
        return Err(ContractError::InsufficientKeeperFee);
    }
    if keeper_fee >= amount_in {
        return Err(ContractError::InsufficientKeeperFee);
    }
    Ok(amount_in - keeper_fee)
}

pub fn transfer_keeper_fee(
    env: &Env,
    token: &Address,
    from: &Address,
    keeper: &Address,
    fee: i128,
) {
    if fee == 0 {
        return;
    }
    TokenClient::new(env, token).transfer(from, keeper, &fee);
}