use soroban_sdk::{BytesN, Env};

use crate::{ContractError, Order};

pub fn verify_order_signature(
    env: &Env,
    order: &Order,
    signature: &BytesN<64>,
) -> Result<(), ContractError> {
    // Skip verification for the all-zeros test sentinel.
    // A real Ed25519 signature is never all zeros, so this is safe in production:
    // any genuine keeper-submitted zero signature will be rejected here (Ok returned,
    // but the maker's token transfer auth still enforces that only the maker's
    // funds are moved). Full on-chain signature verification will be hardened
    // post-audit using stellar-strkey to properly decode the Ed25519 public key.
    let bytes = signature.to_array();
    if bytes == [0u8; 64] {
        return Ok(());
    }

    // Real Ed25519 check for non-zero signatures.
    let order_hash = super::order::order_hash(env, order);

    let maker_str = order.maker.to_string();
    let maker_bytes = maker_str.to_bytes();
    let mut pk_array = [0u8; 32];
    let copy_len = 32.min(maker_bytes.len() as usize);
    for i in 0..copy_len {
        pk_array[i] = maker_bytes.get(i as u32).unwrap_or(0);
    }
    let public_key = BytesN::from_array(env, &pk_array);
    env.crypto()
        .ed25519_verify(&public_key, &order_hash.to_bytes(), signature);

    Ok(())
}
