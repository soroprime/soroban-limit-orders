use crate::helpers::TestEnv;

#[test]
fn test_keeper_fee_deducted_from_swap_amount() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_order(1, 1000, 50, 950, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    let token_in_client = token::Client::new(&test_env.env, &test_env.token_in);
    let token_out_client = token::Client::new(&test_env.env, &test_env.token_out);

    assert_eq!(token_in_client.balance(&test_env.maker), 99_950);
    assert_eq!(token_out_client.balance(&test_env.maker), 950);
    assert_eq!(token_in_client.balance(&test_env.keeper), 50);
}

#[test]
fn test_keeper_fee_equals_amount_in_rejected() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_order(1, 1000, 1000, 900, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_keeper_fee_exceeds_amount_in_rejected() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_order(1, 1000, 1500, 900, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_negative_keeper_fee_rejected() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_order(1, 1000, -10, 900, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_zero_keeper_fee_works() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_order(1, 1000, 0, 1000, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    let inner = result.unwrap();
    assert!(inner.is_ok());
    let amount_out = inner.unwrap();
    assert_eq!(amount_out, 1000);

    let token_in_client = token::Client::new(&test_env.env, &test_env.token_in);
    assert_eq!(token_in_client.balance(&test_env.keeper), 0);
}

mod token {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "Client")]
    pub trait Token {
        fn balance(env: Env, id: Address) -> i128;
    }
}