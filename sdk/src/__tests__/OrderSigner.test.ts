import { Keypair } from '@stellar/stellar-sdk';
import { Order } from '../types';
import { signOrder, verifyOrderSignature } from '../order/OrderSigner';
import { hashOrder } from '../order/OrderHasher';

describe('OrderSigner', () => {
  let keypair: Keypair;
  let order: Order;

  beforeAll(() => {
    keypair = Keypair.random();
    order = {
      maker: keypair.publicKey(),
      tokenIn: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH',
      tokenOut: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBI',
      amountIn: 1000n,
      minAmountOut: 900n,
      expiry: 9999999999,
      nonce: 1n,
      keeperFee: 10n,
      preferredDex: null,
    };
  });

  it('signs and verifies correctly', () => {
    const signature = signOrder(order, keypair);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);

    const valid = verifyOrderSignature(order, signature, keypair.publicKey());
    expect(valid).toBe(true);
  });

  it('rejects tampered order', () => {
    const signature = signOrder(order, keypair);
    const tamperedOrder = { ...order, amountIn: 2000n };
    const valid = verifyOrderSignature(tamperedOrder, signature, keypair.publicKey());
    expect(valid).toBe(false);
  });

  it('rejects wrong keypair', () => {
    const signature = signOrder(order, keypair);
    const otherKeypair = Keypair.random();
    const valid = verifyOrderSignature(order, signature, otherKeypair.publicKey());
    expect(valid).toBe(false);
  });

  it('rejects invalid base64 signature', () => {
    const valid = verifyOrderSignature(order, '!!!notbase64', keypair.publicKey());
    expect(valid).toBe(false);
  });

  it('rejects wrong length signature', () => {
    const valid = verifyOrderSignature(order, Buffer.alloc(32).toString('base64'), keypair.publicKey());
    expect(valid).toBe(false);
  });
});