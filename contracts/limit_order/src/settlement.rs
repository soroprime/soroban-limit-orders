use soroban_sdk::{Address, BytesN, Env, contractclient, String};

use crate::{ContractError, Order, events, fee, signature, storage};

#[contractclient(name = "DexClient")]
pub trait Dex {
    fn swap(env: Env, token_in: Address, token_out: Address, amount_in: i128) -> i128;
}

pub fn settle(
    env: Env,
    order: Order,
    signature: BytesN<64>,
    dex_address: Address,
) -> Result<i128, ContractError> {
    signature::verify_order_signature(&env, &order, &signature)?;

    let now = env.ledger().timestamp();
    if now >= order.expiry {
        return Err(ContractError::OrderExpired);
    }

    if storage::is_used(&env, &order.maker, order.nonce) {
        if storage::is_filled(&env, &order.maker, order.nonce) {
            return Err(ContractError::OrderAlreadyFilled);
        } else {
            return Err(ContractError::OrderCancelled);
        }
    }

    let swap_amount = fee::deduct_keeper_fee(order.amount_in, order.keeper_fee)?;

    let dex_client = DexClient::new(&env, &dex_address);
    let actual_out = dex_client.swap(&order.token_in, &order.token_out, &swap_amount);

    if actual_out < order.min_amount_out {
        return Err(ContractError::SlippageExceeded);
    }

    let token_in_client = token::Client::new(&env, &order.token_in);
    token_in_client.transfer(&order.maker, &env.current_contract_address(), &order.amount_in);

    let token_out_client = token::Client::new(&env, &order.token_out);
    token_out_client.transfer(&env.current_contract_address(), &order.maker, &actual_out);

    fee::transfer_keeper_fee(
        &env,
        &order.token_in,
        &env.current_contract_address(),
        &env.current_contract_address(),
        order.keeper_fee,
    );

    storage::mark_filled(&env, &order.maker, order.nonce);

    events::emit_order_filled(
        &env,
        &order.maker,
        order.nonce,
        &order.token_in,
        &order.token_out,
        order.amount_in,
        actual_out,
        &env.current_contract_address(),
    );

    Ok(actual_out)
}

pub fn simulate_settlement(env: Env, order: Order) -> Result<i128, ContractError> {
    let now = env.ledger().timestamp();
    if now >= order.expiry {
        return Err(ContractError::OrderExpired);
    }

    if storage::is_used(&env, &order.maker, order.nonce) {
        if storage::is_filled(&env, &order.maker, order.nonce) {
            return Err(ContractError::OrderAlreadyFilled);
        } else {
            return Err(ContractError::OrderCancelled);
        }
    }

    let swap_amount = fee::deduct_keeper_fee(order.amount_in, order.keeper_fee)?;

    let dex_address = order.preferred_dex.unwrap_or(Address::from_string(&String::from_str(&env, "CDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF")));
    let dex_client = DexClient::new(&env, &dex_address);
    let actual_out = dex_client.swap(&order.token_in, &order.token_out, &swap_amount);

    if actual_out < order.min_amount_out {
        return Err(ContractError::SlippageExceeded);
    }

    Ok(actual_out)
}

mod token {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "Client")]
    pub trait Token {
        fn transfer(env: Env, from: Address, to: Address, amount: i128);
    }
}