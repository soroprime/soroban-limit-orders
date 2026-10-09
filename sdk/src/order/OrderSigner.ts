import { Keypair } from '@stellar/stellar-sdk';
import { Order } from '../types';
import { hashOrder } from './OrderHasher';

export function signOrder(order: Order, keypair: Keypair): string {
  const hash = hashOrder(order);
  const signature = keypair.sign(hash);
  return signature.toString('base64');
}

export function verifyOrderSignature(order: Order, signatureBase64: string, publicKey: string): boolean {
  try {
    const hash = hashOrder(order);
    const sig = Buffer.from(signatureBase64, 'base64');
    if (sig.length !== 64) return false;

    const pk = Buffer.from(publicKey, 'base64');
    if (pk.length !== 32) return false;

    const nacl = require('tweetnacl');
    return nacl.sign.detached.verify(new Uint8Array(hash), new Uint8Array(sig), new Uint8Array(pk));
  } catch {
    return false;
  }
}