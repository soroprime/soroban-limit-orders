use crate::helpers::TestEnv;
use soroban_sdk::testutils::Ledger;

#[test]
fn test_settlement_expired_order() {
    let mut test_env = TestEnv::new();
    test_env.env.ledger().with_mut(|li| li.timestamp = 2_000_000);

    let (order, signature) = test_env.create_order(1, 1000, 10, 900, 1_500_000);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}

#[test]
fn test_settlement_expiry_equals_now() {
    let mut test_env = TestEnv::new();
    test_env.env.ledger().with_mut(|li| li.timestamp = 1_000_000);

    let (order, signature) = test_env.create_order(1, 1000, 10, 900, 1_000_000);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok());
    assert!(result.unwrap().is_err());
}