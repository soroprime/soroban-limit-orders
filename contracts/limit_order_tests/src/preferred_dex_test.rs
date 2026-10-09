use crate::helpers::TestEnv;
use mock_dex::Client as MockDexClient;
use soroban_sdk::testutils::Address as _;

/// When `order.preferred_dex` is `Some(addr)`, settlement must execute on
/// that exact DEX regardless of what other DEXes would offer.
#[test]
fn test_preferred_dex_honoured() {
    let test_env = TestEnv::new();

    // DEX B has a far better rate (2:1) than DEX A (1:1).
    let dex_b_admin = soroban_sdk::Address::generate(&test_env.env);
    let dex_b = test_env.env.register_contract(None, mock_dex::MockDex);
    MockDexClient::new(&test_env.env, &dex_b).init(&dex_b_admin);
    MockDexClient::new(&test_env.env, &dex_b)
        .set_price(&test_env.token_in, &test_env.token_out, &2_000_000i128);

    // Order explicitly prefers DEX A (the worse one).
    let (mut order, signature) = test_env.create_signed_order(1);
    order.preferred_dex = Some(test_env.dex.clone());

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    // We pass dex_b as the dex_address arg — but preferred_dex overrides it.
    let result = contract.try_settle(&order, &signature, &dex_b);
    assert!(result.is_ok(), "invoke failed: {:?}", result);
    let amount_out = result.unwrap().expect("contract error");

    // DEX A: swap_amount=990, rate=1:1 → 990  (NOT 1980 from DEX B)
    assert_eq!(amount_out, 990);
}

/// When preferred_dex is None the caller-supplied dex_address is used.
#[test]
fn test_no_preferred_dex_uses_caller_supplied() {
    let test_env = TestEnv::new();

    let (order, signature) = test_env.create_signed_order(1);
    assert!(order.preferred_dex.is_none());

    let contract = limit_order::Client::new(&test_env.env, &test_env.contract);
    let result = contract.try_settle(&order, &signature, &test_env.dex);
    assert!(result.is_ok(), "invoke failed: {:?}", result);
    let amount_out = result.unwrap().expect("contract error");

    // DEX (rate 1:1): swap_amount=990 → out=990
    assert_eq!(amount_out, 990);
}
