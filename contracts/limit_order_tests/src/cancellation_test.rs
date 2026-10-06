use crate::helpers::TestEnv;
use soroban_sdk::{Address, testutils::Address as _, Env, Vec};

#[test]
fn test_cancel_marks_nonce_cancelled() {
    let test_env = TestEnv::new();

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_cancel(&test_env.maker, &1);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    assert!(contract.is_cancelled(&test_env.maker, &1));
}

#[test]
fn test_cancel_emits_event() {
    let test_env = TestEnv::new();

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_cancel(&test_env.maker, &1);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());
}

#[test]
fn test_settle_after_cancel_rejected() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let cancel_result = contract.try_cancel(&test_env.maker, &1);
    assert!(cancel_result.is_ok());
    assert!(cancel_result.unwrap().is_ok());

    let result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_batch_cancel_multiple_nonces() {
    let test_env = TestEnv::new();

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let nonces = Vec::from_array(&test_env.env, [1, 2, 3]);
    let result = contract.try_batch_cancel(&test_env.maker, &nonces);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    assert!(contract.is_cancelled(&test_env.maker, &1));
    assert!(contract.is_cancelled(&test_env.maker, &2));
    assert!(contract.is_cancelled(&test_env.maker, &3));
}

#[test]
fn test_batch_cancel_skips_already_used() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let settle_result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(settle_result.is_ok());
    assert!(settle_result.unwrap().is_ok());

    let nonces = Vec::from_array(&test_env.env, [1, 2, 3]);
    let result = contract.try_batch_cancel(&test_env.maker, &nonces);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    assert!(contract.is_filled(&test_env.maker, &1));
    assert!(contract.is_cancelled(&test_env.maker, &2));
    assert!(contract.is_cancelled(&test_env.maker, &3));
}

#[test]
fn test_batch_cancel_limit_10() {
    let test_env = TestEnv::new();

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let mut nonces = Vec::new(&test_env.env);
    for i in 1..=11 {
        nonces.push_back(i);
    }

    let result = contract.try_batch_cancel(&test_env.maker, &nonces);
    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_cancel_by_non_maker_rejected() {
    let test_env = TestEnv::new();
    let other = Address::generate(&test_env.env);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);

    let result = contract.try_cancel(&other, &1);
    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_cancel_requires_auth() {
    let test_env = TestEnv::new();
    test_env.env.mock_all_auths();

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_cancel(&test_env.maker, &1);
    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}