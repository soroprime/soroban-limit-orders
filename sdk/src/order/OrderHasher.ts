import { createHash } from 'crypto';
import { Order } from '../types';

function pushStr(parts: Buffer[], s: string): void {
  const b = Buffer.from(s, 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(b.length, 0);
  parts.push(len, b);
}

function pushI128LE(parts: Buffer[], value: bigint): void {
  const buf = Buffer.alloc(16);
  const mask = BigInt('0xFFFFFFFFFFFFFFFF');
  const lo = value & mask;
  const hi = value >> BigInt(64);
  buf.writeBigInt64LE(BigInt.asIntN(64, lo), 0);
  buf.writeBigInt64LE(BigInt.asIntN(64, hi), 8);
  parts.push(buf);
}

function pushU64LE(parts: Buffer[], value: bigint): void {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  parts.push(buf);
}

export function hashOrder(order: Order): Buffer {
  const parts: Buffer[] = [];

  pushStr(parts, order.maker);
  pushStr(parts, order.tokenIn);
  pushStr(parts, order.tokenOut);
  pushI128LE(parts, order.amountIn);
  pushI128LE(parts, order.minAmountOut);
  pushU64LE(parts, BigInt(order.expiry));
  pushU64LE(parts, order.nonce);
  pushI128LE(parts, order.keeperFee);

  if (order.preferredDex === null || order.preferredDex === undefined) {
    parts.push(Buffer.from([0x00]));
  } else {
    parts.push(Buffer.from([0x01]));
    pushStr(parts, order.preferredDex);
  }

  const payload = Buffer.concat(parts);
  return createHash('sha256').update(payload).digest();
}