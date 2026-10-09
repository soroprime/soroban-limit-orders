use soroban_sdk::{Address, BytesN, Env};

use crate::{ContractError, Order, events, fee, router, signature, storage, token};

pub fn settle(
    env: Env,
    order: Order,
    sig: BytesN<64>,
    dex_address: Address,
) -> Result<i128, ContractError> {
    signature::verify_order_signature(&env, &order, &sig)?;

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

    let winning_dex = if order.preferred_dex.is_some() {
        let (dex, _) = router::find_best_dex(&env, &order, swap_amount, &[dex_address.clone()]);
        dex
    } else {
        dex_address.clone()
    };

    let actual_out =
        router::route_swap(&env, &winning_dex, &order.token_in, &order.token_out, swap_amount);

    if actual_out < order.min_amount_out {
        return Err(ContractError::SlippageExceeded);
    }

    let contract_addr = env.current_contract_address();

    token::Client::new(&env, &order.token_in).transfer(
        &order.maker,
        &contract_addr,
        &order.amount_in,
    );

    token::Client::new(&env, &order.token_out).transfer(
        &contract_addr,
        &order.maker,
        &actual_out,
    );

    if order.keeper_fee > 0 {
        fee::transfer_keeper_fee(
            &env,
            &order.token_in,
            &contract_addr,
            &contract_addr,
            order.keeper_fee,
        );
    }

    storage::mark_filled(&env, &order.maker, order.nonce);

    events::emit_order_filled(
        &env,
        &order.maker,
        order.nonce,
        &order.token_in,
        &order.token_out,
        order.amount_in,
        actual_out,
        &contract_addr,
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

    let dex_address = order
        .preferred_dex
        .clone()
        .ok_or(ContractError::DexCallFailed)?;

    let actual_out =
        router::route_swap(&env, &dex_address, &order.token_in, &order.token_out, swap_amount);

    if actual_out < order.min_amount_out {
        return Err(ContractError::SlippageExceeded);
    }

    Ok(actual_out)
}
