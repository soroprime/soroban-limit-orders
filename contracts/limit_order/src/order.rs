//! Order data structures and the canonical order hash.
//!
//! The canonical hash is what a maker signs off-chain and what the contract
//! verifies during settlement. The TypeScript SDK (`sdk/src/order/OrderHasher.ts`)
//! must reproduce the exact byte layout below so that signatures produced
//! client-side verify on-chain.

use soroban_sdk::{contracttype, crypto::Hash, Address, Bytes, BytesN, Env};

/// A signed limit order.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Order {
    /// Address of the order creator.
    pub maker: Address,
    /// Token being sold (input).
    pub token_in: Address,
    /// Token being bought (output).
    pub token_out: Address,
    /// Exact amount of `token_in` to sell.
    pub amount_in: i128,
    /// Minimum amount of `token_out` to receive (encodes limit price + slippage).
    pub min_amount_out: i128,
    /// Unix timestamp (seconds) after which the order is invalid.
    pub expiry: u64,
    /// Per-maker nonce used to prevent replays and enable cancellation.
    pub nonce: u64,
    /// Fee paid to the keeper in `token_in` (taken before the swap).
    pub keeper_fee: i128,
    /// Optional preferred DEX contract address (None = route to any).
    pub preferred_dex: Option<Address>,
}

/// Semantics of an order.
///
/// On-chain the four variants settle identically; they exist so clients and
/// the UI can label and interpret orders.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OrderType {
    /// Buy `token_out` when its price drops to (or below) the target.
    LimitBuy,
    /// Sell `token_out` when its price rises to (or above) the target.
    LimitSell,
    /// Exit a position when the price falls to (or below) the stop price.
    StopLoss,
    /// Lock in gains when the price hits the target.
    TakeProfit,
}

// Byte layout of the canonical order serialization (v1).
//
// Fields are serialized in exactly this order:
//
// | Field              | Encoding                              |
// |--------------------|---------------------------------------|
// | `maker`            | u32 LE length + UTF-8 StrKey bytes    |
// | `token_in`         | u32 LE length + UTF-8 StrKey bytes    |
// | `token_out`        | u32 LE length + UTF-8 StrKey bytes    |
// | `amount_in`        | i128, 16 bytes little-endian          |
// | `min_amount_out`   | i128, 16 bytes little-endian          |
// | `expiry`           | u64, 8 bytes little-endian            |
// | `nonce`            | u64, 8 bytes little-endian            |
// | `keeper_fee`       | i128, 16 bytes little-endian          |
// | `preferred_dex`    | 1 tag byte (0 = None, 1 = Some); when |
// |                    | Some, u32 LE length + StrKey bytes    |
//
// The SHA-256 digest of this buffer is the canonical order hash signed by
// makers. Length prefixes keep the encoding unambiguous for variable-length
// address strings.

/// Canonical order hash for the given `Order`.
///
/// Returns the SHA-256 digest of the canonical serialization described above.
pub fn order_hash(env: &Env, order: &Order) -> BytesN<32> {
    let mut buf = Bytes::new(env);

    push_str(env, &mut buf, &order.maker.to_string());
    push_str(env, &mut buf, &order.token_in.to_string());
    push_str(env, &mut buf, &order.token_out.to_string());
    buf.append(&Bytes::from_slice(env, &order.amount_in.to_le_bytes()));
    buf.append(&Bytes::from_slice(env, &order.min_amount_out.to_le_bytes()));
    buf.append(&Bytes::from_slice(env, &order.expiry.to_le_bytes()));
    buf.append(&Bytes::from_slice(env, &order.nonce.to_le_bytes()));
    buf.append(&Bytes::from_slice(env, &order.keeper_fee.to_le_bytes()));
    push_optional_str(env, &mut buf, &order.preferred_dex);

    let hash: Hash<32> = env.crypto().sha256(&buf);
    hash.to_bytes()
}

/// Appends a u32 LE length prefix followed by the raw UTF-8 bytes of `value`.
fn push_str(env: &Env, buf: &mut Bytes, value: &soroban_sdk::String) {
    let bytes = value.to_bytes();
    buf.append(&Bytes::from_slice(env, &bytes.len().to_le_bytes()));
    buf.append(&bytes);
}

/// Appends a 1-byte tag then, when `Some`, a length-prefixed StrKey.
fn push_optional_str(env: &Env, buf: &mut Bytes, dex: &Option<Address>) {
    match dex {
        None => {
            buf.append(&Bytes::from_slice(env, &[0u8]));
        }
        Some(addr) => {
            buf.append(&Bytes::from_slice(env, &[1u8]));
            push_str(env, buf, &addr.to_string());
        }
    }
}