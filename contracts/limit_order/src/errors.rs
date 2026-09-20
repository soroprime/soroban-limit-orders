//! Contract error types covering all settlement failure modes.

use soroban_sdk::contracterror;

/// Errors returned (as panics) by the settlement contract.
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(i32)]
pub enum ContractError {
    /// The order signature does not match the maker's keypair.
    InvalidSignature = 1,
    /// `now >= order.expiry` — the order can no longer be settled.
    OrderExpired = 2,
    /// The nonce was already filled on-chain.
    OrderAlreadyFilled = 3,
    /// The nonce was cancelled by the maker.
    OrderCancelled = 4,
    /// DEX quote fell below `order.min_amount_out`.
    SlippageExceeded = 5,
    /// `keeper_fee` is negative or exceeds `amount_in`.
    InsufficientKeeperFee = 6,
    /// Nonce is out of range / misused.
    InvalidNonce = 7,
    /// The caller is not authorized for this operation.
    UnauthorizedCaller = 8,
    /// The cross-contract DEX call failed.
    DexCallFailed = 9,
}