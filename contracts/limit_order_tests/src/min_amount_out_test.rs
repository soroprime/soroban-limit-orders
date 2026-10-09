use crate::helpers::TestEnv;
use limit_order::ContractError;
use mock_dex::Client as MockDexClient;
use soroban_sdk::testutils::Address as _;

/// When the DEX output falls below `min_amount_out` the contract must return
/// `ContractError::SlippageExceeded` and leave balances unchanged.
#[test]
fn test_slippage_exceeded_rejected() {
    let test_env = TestEnv::new();

    // Deploy a DEX with a very poor rate: 0.5:1 (rate = 500_000)
    let bad_dex_admin = soroban_sdk::Address::generate(&test_env.env);
    let bad_dex = test_env.env.register_contract(None, mock_dex::MockDex);
    MockDexClient::new(&test_env.env, &bad_dex).init(&bad_dex_admin);
    MockDexClient::new(&test_env.env, &bad_dex)
        .set_price(&test_env.token_in, &test_env.token_out, &500_000i128);

    // amount_in=1000, keeper_fee=0, swap_amount=1000 → 500 out
    // min_amount_out=900 → should be rejected
    let (order, signature) = test_env.create_order(1, 1000, 0, 900, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &bad_dex);

    assert!(result.is_ok(), "unexpected invoke error: {:?}", result);
    let inner = result.unwrap();
    assert!(inner.is_err(), "expected SlippageExceeded, got Ok");
    assert_eq!(inner.unwrap_err(), ContractError::SlippageExceeded.into());
}

/// When the DEX output exactly meets `min_amount_out` the swap must succeed.
#[test]
fn test_exact_min_amount_out_passes() {
    let test_env = TestEnv::new();

    // Default DEX rate is 1:1.
    // amount_in=1000, keeper_fee=0, swap_amount=1000 → out=1000
    // min_amount_out=1000 → should pass (out >= min)
    let (order, signature) = test_env.create_order(1, 1000, 0, 1000, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok(), "invoke failed: {:?}", result);
    let amount_out = result.unwrap().expect("contract error");
    assert_eq!(amount_out, 1000);
}

/// Slippage check applies to net amount after keeper fee.
#[test]
fn test_slippage_check_uses_net_swap_amount() {
    let test_env = TestEnv::new();

    // amount_in=1000, keeper_fee=100, swap_amount=900 → DEX (1:1) out=900
    // min_amount_out=901 → should fail
    let (order, signature) = test_env.create_order(1, 1000, 100, 901, u64::MAX);

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);

    assert!(result.is_ok(), "unexpected invoke error: {:?}", result);
    let inner = result.unwrap();
    assert_eq!(inner.unwrap_err(), ContractError::SlippageExceeded.into());
}
