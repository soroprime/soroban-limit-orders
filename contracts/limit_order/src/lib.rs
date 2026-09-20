#![no_std]

//! Limit Order settlement contract — Day 1 scaffold.
//! Entry points, order types and error definitions land in follow-up commits.

use soroban_sdk::contract;

#[contract]
pub struct LimitOrder;