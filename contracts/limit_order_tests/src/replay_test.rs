use crate::helpers::TestEnv;

#[test]
fn test_replay_attack_rejected() {
    let test_env = TestEnv::new();
    let (order, signature) = test_env.create_signed_order(1);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);

    let result1 = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result1.is_ok());
    assert!(result1.unwrap().is_ok());

    let result2 = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result2.is_ok());
    assert!(result2.unwrap().is_err());
}

#[test]
fn test_replay_after_cancel_rejected() {
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