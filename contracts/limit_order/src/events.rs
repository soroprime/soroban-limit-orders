use soroban_sdk::{Address, Env, contractevent};

#[contractevent]
pub struct OrderFilledEvent {
    pub maker: Address,
    pub nonce: u64,
    pub token_in: Address,
    pub token_out: Address,
    pub amount_in: i128,
    pub amount_out: i128,
    pub keeper: Address,
}

#[contractevent]
pub struct OrderCancelledEvent {
    pub maker: Address,
    pub nonce: u64,
}

#[contractevent]
pub struct OrderExpiredEvent {
    pub maker: Address,
    pub nonce: u64,
}

pub fn emit_order_filled(
    env: &Env,
    maker: &Address,
    nonce: u64,
    token_in: &Address,
    token_out: &Address,
    amount_in: i128,
    amount_out: i128,
    keeper: &Address,
) {
    OrderFilledEvent {
        maker: maker.clone(),
        nonce,
        token_in: token_in.clone(),
        token_out: token_out.clone(),
        amount_in,
        amount_out,
        keeper: keeper.clone(),
    }
    .publish(env);
}

pub fn emit_order_cancelled(env: &Env, maker: &Address, nonce: u64) {
    OrderCancelledEvent {
        maker: maker.clone(),
        nonce,
    }
    .publish(env);
}

pub fn emit_order_expired(env: &Env, maker: &Address, nonce: u64) {
    OrderExpiredEvent {
        maker: maker.clone(),
        nonce,
    }
    .publish(env);
}