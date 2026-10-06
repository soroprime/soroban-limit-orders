use crate::helpers::TestEnv;
use soroban_sdk::{Address, testutils::Address as _};

#[test]
fn test_invalid_signature_rejected() {
    let test_env = TestEnv::new();
    let other_maker = Address::generate(&test_env.env);

    let mut order = test_env.create_order(1, 1000, 10, 900, u64::MAX).0;
    order.maker = other_maker.clone();

    let signature = soroban_sdk::BytesN::from_array(&test_env.env, &[0u8; 64]);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_tampered_order_rejected() {
    let test_env = TestEnv::new();
    let (mut order, signature) = test_env.create_signed_order(1);

    order.amount_in = 2000;

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}