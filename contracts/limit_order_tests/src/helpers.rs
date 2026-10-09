use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

use limit_order::{ContractError, Order};
use mock_dex::Client as MockDexClient;

pub struct TestEnv {
    pub env: Env,
    pub maker: Address,
    pub keeper: Address,
    pub token_in: Address,
    pub token_out: Address,
    pub dex: Address,
    pub contract: Address,
    /// Admin of the mock DEX — used in multi-DEX tests to set rates.
    pub dex_admin: Address,
}

impl TestEnv {
    pub fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        // ── Set protocol version FIRST ──────────────────────────────────────
        // soroban-sdk 28 requires protocol_version ≥ 28 before any host calls.
        env.ledger().set(LedgerInfo {
            timestamp: 1_000_000,
            protocol_version: 28,
            sequence_number: 1,
            network_id: Default::default(),
            base_reserve: 10,
            max_entry_ttl: 100_000,
            min_persistent_entry_ttl: 100,
            min_temp_entry_ttl: 100,
        });

        // ── Addresses ───────────────────────────────────────────────────────
        // Address::generate in soroban-sdk 28 testutils produces a contract
        // address, which can hold SAC balances without a trustline.
        let maker = Address::generate(&env);
        let keeper = Address::generate(&env);

        // ── SAC tokens ──────────────────────────────────────────────────────
        let sac_in  = env.register_stellar_asset_contract_v2(Address::generate(&env));
        let sac_out = env.register_stellar_asset_contract_v2(Address::generate(&env));
        let token_in  = sac_in.address();
        let token_out = sac_out.address();

        // ── Mock DEX ────────────────────────────────────────────────────────
        let dex_admin = Address::generate(&env);
        let dex = env.register_contract(None, mock_dex::MockDex);
        MockDexClient::new(&env, &dex).init(&dex_admin);
        MockDexClient::new(&env, &dex).set_price(&token_in, &token_out, &1_000_000i128);

        // ── Settlement contract ─────────────────────────────────────────────
        let contract = env.register_contract(None, limit_order::LimitOrder);

        // ── Fund accounts ───────────────────────────────────────────────────
        StellarAssetClient::new(&env, &token_in).mint(&maker, &100_000i128);
        // The contract needs token_out so it can deliver it to the maker.
        StellarAssetClient::new(&env, &token_out).mint(&contract, &100_000i128);

        TestEnv { env, maker, keeper, token_in, token_out, dex, contract, dex_admin }
    }

    pub fn create_order(
        &self,
        nonce: u64,
        amount_in: i128,
        keeper_fee: i128,
        min_amount_out: i128,
        expiry: u64,
    ) -> (Order, BytesN<64>) {
        let order = Order {
            maker: self.maker.clone(),
            token_in: self.token_in.clone(),
            token_out: self.token_out.clone(),
            amount_in,
            min_amount_out,
            expiry,
            nonce,
            keeper_fee,
            preferred_dex: None,
        };
        // Signature verification is gated behind cfg(not(feature="testutils"));
        // with the testutils feature active the check is a no-op, so any bytes work.
        let signature = BytesN::from_array(&self.env, &[0u8; 64]);
        (order, signature)
    }

    pub fn create_signed_order(&self, nonce: u64) -> (Order, BytesN<64>) {
        // amount_in=1000, keeper_fee=10, rate=1_000_000 (1:1)
        // → swap_amount = 990 → mock_dex returns 990
        // min_amount_out=900 → slippage check passes
        self.create_order(nonce, 1000, 10, 900, u64::MAX)
    }

    /// Query token balance for an address.
    pub fn balance_of(&self, token: &Address, who: &Address) -> i128 {
        TokenClient::new(&self.env, token).balance(who)
    }
}
