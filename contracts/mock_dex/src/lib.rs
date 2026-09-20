#![no_std]

//! Mock DEX contract — Day 1 scaffold.
//! Configurable pool price + swap/get_quote entry points land in follow-ups.

use soroban_sdk::contract;

#[contract]
pub struct MockDex;