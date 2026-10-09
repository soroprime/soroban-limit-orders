import { Keypair } from '@stellar/stellar-sdk';
import { OrderBuilder } from '../order/OrderBuilder';
import { Order } from '../types';

describe('OrderBuilder', () => {
  let keypair: Keypair;

  beforeAll(() => {
    keypair = Keypair.random();
  });

  const validParams = {
    maker: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    tokenIn: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH',
    tokenOut: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBI',
    amountIn: '1000',
    minAmountOut: '900',
    expiry: Math.floor(Date.now() / 1000) + 86400,
    nonce: 1,
    keeperFee: '10',
    preferredDex: null,
  };

  it('builds valid order', () => {
    const order = new OrderBuilder()
      .maker(validParams.maker)
      .tokenIn(validParams.tokenIn)
      .tokenOut(validParams.tokenOut)
      .amountIn(validParams.amountIn)
      .minAmountOut(validParams.minAmountOut)
      .expiry(validParams.expiry)
      .nonce(validParams.nonce)
      .keeperFee(validParams.keeperFee)
      .preferredDex(validParams.preferredDex)
      .build();

    expect(order.maker).toBe(validParams.maker);
    expect(order.amountIn).toBe(1000n);
    expect(order.nonce).toBe(1n);
  });

  it('signs order correctly', () => {
    const { order, signature } = new OrderBuilder()
      .maker(keypair.publicKey())
      .tokenIn(validParams.tokenIn)
      .tokenOut(validParams.tokenOut)
      .amountIn(validParams.amountIn)
      .minAmountOut(validParams.minAmountOut)
      .expiry(validParams.expiry)
      .nonce(validParams.nonce)
      .keeperFee(validParams.keeperFee)
      .preferredDex(validParams.preferredDex)
      .sign(keypair);

    expect(order).toBeDefined();
    expect(signature).toBeDefined();
  });

  it('rejects zero amountIn', () => {
    expect(() =>
      new OrderBuilder()
        .maker(validParams.maker)
        .tokenIn(validParams.tokenIn)
        .tokenOut(validParams.tokenOut)
        .amountIn('0')
        .minAmountOut(validParams.minAmountOut)
        .expiry(validParams.expiry)
        .nonce(validParams.nonce)
        .keeperFee(validParams.keeperFee)
        .preferredDex(validParams.preferredDex)
        .build()
    ).toThrow('amountIn must be positive');
  });

  it('rejects expired order', () => {
    expect(() =>
      new OrderBuilder()
        .maker(validParams.maker)
        .tokenIn(validParams.tokenIn)
        .tokenOut(validParams.tokenOut)
        .amountIn(validParams.amountIn)
        .minAmountOut(validParams.minAmountOut)
        .expiry(Math.floor(Date.now() / 1000) - 1)
        .nonce(validParams.nonce)
        .keeperFee(validParams.keeperFee)
        .preferredDex(validParams.preferredDex)
        .build()
    ).toThrow('expiry must be in the future');
  });

  it('rejects keeperFee >= amountIn', () => {
    expect(() =>
      new OrderBuilder()
        .maker(validParams.maker)
        .tokenIn(validParams.tokenIn)
        .tokenOut(validParams.tokenOut)
        .amountIn('100')
        .minAmountOut('90')
        .expiry(validParams.expiry)
        .nonce(validParams.nonce)
        .keeperFee('100')
        .preferredDex(validParams.preferredDex)
        .build()
    ).toThrow('keeperFee must be less than amountIn');
  });

  it('rejects invalid maker address', () => {
    expect(() =>
      new OrderBuilder()
        .maker('INVALID')
        .tokenIn(validParams.tokenIn)
        .tokenOut(validParams.tokenOut)
        .amountIn(validParams.amountIn)
        .minAmountOut(validParams.minAmountOut)
        .expiry(validParams.expiry)
        .nonce(validParams.nonce)
        .keeperFee(validParams.keeperFee)
        .preferredDex(validParams.preferredDex)
        .build()
    ).toThrow('maker must be a valid Stellar G-address');
  });

  it('throws on missing required fields', () => {
    expect(() => new OrderBuilder().build()).toThrow('Missing required field');
  });
});