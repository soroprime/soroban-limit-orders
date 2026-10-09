use crate::helpers::TestEnv;
use limit_order::ContractError;

#[test]
fn test_settlement_happy_path() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);
    if let Err(ref e) = result {
        panic!("invoke error: {:?}", e);
    }
    assert!(result.is_ok());
    let inner = result.unwrap();
    assert!(inner.is_ok());
    let amount_out = inner.unwrap();
    assert_eq!(amount_out, 990);

    let token_in_client = token::Client::new(&test_env.env, &test_env.token_in);
    let token_out_client = token::Client::new(&test_env.env, &test_env.token_out);

    assert_eq!(token_in_client.balance(&test_env.maker), 99_000);
    assert_eq!(token_out_client.balance(&test_env.maker), 990);

    let keeper_balance = token_in_client.balance(&test_env.keeper);
    assert_eq!(keeper_balance, 10);

    assert!(contract.is_filled(&test_env.maker, &1));
}

#[test]
fn test_settlement_maker_receives_token_out() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    let token_out_client = token::Client::new(&test_env.env, &test_env.token_out);
    let maker_balance = token_out_client.balance(&test_env.maker);
    assert!(maker_balance > 0);
}

#[test]
fn test_settlement_keeper_receives_keeper_fee() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    let token_in_client = token::Client::new(&test_env.env, &test_env.token_in);
    let keeper_balance = token_in_client.balance(&test_env.keeper);
    assert_eq!(keeper_balance, 10);
}

#[test]
fn test_settlement_nonce_marked_filled() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result.is_ok());
    assert!(result.unwrap().is_ok());

    assert!(contract.is_filled(&test_env.maker, &1));
}

mod token {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "Client")]
    pub trait Token {
        fn balance(env: Env, id: Address) -> i128;
    }
}