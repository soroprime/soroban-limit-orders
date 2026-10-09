import { Order } from '../types';
import { validateOrder, ValidationResult } from './OrderValidator';
import { signOrder } from './OrderSigner';
import { Keypair } from '@stellar/stellar-sdk';

export class OrderBuilder {
  private partial: Partial<Order> = {};

  maker(address: string): this {
    this.partial.maker = address;
    return this;
  }

  tokenIn(address: string): this {
    this.partial.tokenIn = address;
    return this;
  }

  tokenOut(address: string): this {
    this.partial.tokenOut = address;
    return this;
  }

  amountIn(amount: bigint | string): this {
    this.partial.amountIn = typeof amount === 'string' ? BigInt(amount) : amount;
    return this;
  }

  minAmountOut(amount: bigint | string): this {
    this.partial.minAmountOut = typeof amount === 'string' ? BigInt(amount) : amount;
    return this;
  }

  expiry(timestamp: number): this {
    this.partial.expiry = timestamp;
    return this;
  }

  nonce(nonce: bigint | number): this {
    this.partial.nonce = typeof nonce === 'number' ? BigInt(nonce) : nonce;
    return this;
  }

  keeperFee(fee: bigint | string): this {
    this.partial.keeperFee = typeof fee === 'string' ? BigInt(fee) : fee;
    return this;
  }

  preferredDex(address: string | null): this {
    this.partial.preferredDex = address;
    return this;
  }

  build(): Order {
    const required: (keyof Order)[] = [
      'maker',
      'tokenIn',
      'tokenOut',
      'amountIn',
      'minAmountOut',
      'expiry',
      'nonce',
      'keeperFee',
      'preferredDex',
    ];

    for (const key of required) {
      if (!(key in this.partial)) {
        throw new Error(`Missing required field: ${key}`);
      }
    }

    const order = this.partial as Order;
    const validation = validateOrder(order);
    if (!validation.valid) {
      throw new Error(`Invalid order: ${validation.errors.join(', ')}`);
    }

    return order;
  }

  sign(keypair: Keypair): { order: Order; signature: string } {
    const order = this.build();
    const signature = signOrder(order, keypair);
    return { order, signature };
  }
}