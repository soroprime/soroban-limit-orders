use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
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
}

impl TestEnv {
    pub fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let maker = Address::generate(&env);
        let keeper = Address::generate(&env);
        let token_in = Address::generate(&env);
        let token_out = Address::generate(&env);

        let dex = env.register_contract(None, mock_dex::MockDex);
        MockDexClient::new(&env, &dex).init(&env.current_contract_address());
        MockDexClient::new(&env, &dex).set_price(&token_in, &token_out, &1_000_000);

        let contract = env.register_contract(None, limit_order::LimitOrder);

        let token_in_client = token::Client::new(&env, &token_in);
        let token_out_client = token::Client::new(&env, &token_out);
        token_in_client.mint(&maker, &100_000);
        token_out_client.mint(&contract, &100_000);

        env.ledger().set(LedgerInfo {
            timestamp: 1_000_000,
            protocol_version: 22,
            sequence_number: 1,
            network_id: Default::default(),
            base_reserve: 10,
            max_entry_ttl: 100_000,
            min_persistent_entry_ttl: 100,
            min_temp_entry_ttl: 100,
        });

        TestEnv {
            env,
            maker,
            keeper,
            token_in,
            token_out,
            dex,
            contract,
        }
    }

    pub fn create_order(&self, nonce: u64, amount_in: i128, keeper_fee: i128, min_amount_out: i128, expiry: u64) -> (Order, BytesN<64>) {
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
        let _hash = limit_order::order_hash(&self.env, &order);
        let signature = BytesN::from_array(&self.env, &[0u8; 64]);
        (order, signature)
    }

    pub fn create_signed_order(&self, nonce: u64) -> (Order, BytesN<64>) {
        self.create_order(nonce, 1000, 10, 900, u64::MAX)
    }
}

mod token {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "Client")]
    pub trait Token {
        fn mint(env: Env, to: Address, amount: i128);
        fn balance(env: Env, id: Address) -> i128;
    }
}