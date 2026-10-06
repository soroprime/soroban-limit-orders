use soroban_sdk::{contractclient, Address, Env};

#[contractclient(name = "Client")]
pub trait Token {
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
}