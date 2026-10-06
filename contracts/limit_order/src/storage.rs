use soroban_sdk::{Address, Env, contracttype};

#[contracttype]
pub enum StorageKey {
    FilledNonce(Address, u64),
    CancelledNonce(Address, u64),
}

const NONCE_TTL_LEDGERS: u32 = 100_000;

fn bump(env: &Env, key: &StorageKey) {
    env.storage().persistent().extend_ttl(key, NONCE_TTL_LEDGERS, NONCE_TTL_LEDGERS);
}

pub fn mark_filled(env: &Env, maker: &Address, nonce: u64) {
    let key = StorageKey::FilledNonce(maker.clone(), nonce);
    env.storage().persistent().set(&key, &());
    bump(env, &key);
}

pub fn mark_cancelled(env: &Env, maker: &Address, nonce: u64) {
    let key = StorageKey::CancelledNonce(maker.clone(), nonce);
    env.storage().persistent().set(&key, &());
    bump(env, &key);
}

pub fn is_filled(env: &Env, maker: &Address, nonce: u64) -> bool {
    let key = StorageKey::FilledNonce(maker.clone(), nonce);
    let exists = env.storage().persistent().has(&key);
    if exists {
        bump(env, &key);
    }
    exists
}

pub fn is_cancelled(env: &Env, maker: &Address, nonce: u64) -> bool {
    let key = StorageKey::CancelledNonce(maker.clone(), nonce);
    let exists = env.storage().persistent().has(&key);
    if exists {
        bump(env, &key);
    }
    exists
}

pub fn is_used(env: &Env, maker: &Address, nonce: u64) -> bool {
    is_filled(env, maker, nonce) || is_cancelled(env, maker, nonce)
}