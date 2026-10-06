use soroban_sdk::{BytesN, Env, String};

use crate::{ContractError, Order};

pub fn verify_order_signature(
    env: &Env,
    order: &Order,
    signature: &BytesN<64>,
) -> Result<(), ContractError> {
    let order_hash = super::order::order_hash(env, order);

    let maker_str: String = order.maker.to_string();
    let maker_bytes = maker_str.to_bytes();
    let mut pk_array = [0u8; 32];
    for i in 0..32.min(maker_bytes.len()) {
        pk_array[i as usize] = maker_bytes.get(i).unwrap_or(0);
    }
    let public_key = BytesN::from_array(env, &pk_array);

    env.crypto()
        .ed25519_verify(&public_key, &order_hash.to_bytes(), signature);

    Ok(())
}