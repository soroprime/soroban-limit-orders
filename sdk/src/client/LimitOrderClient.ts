import { OrderBookClient } from './OrderBookClient';
import { ContractClient } from './ContractClient';
import { WebSocketClient, OrderEventType, OrderEvent } from './WebSocketClient';
import { Keypair } from '@stellar/stellar-sdk';
import { Order, OrderWithStatus } from '../types';
import { OrderBuilder } from '../order/OrderBuilder';

export class LimitOrderClient {
  public readonly orderBook: OrderBookClient;
  public readonly contract: ContractClient;
  public readonly ws: WebSocketClient;

  constructor(
    orderBookUrl: string,
    rpcUrl: string,
    contractId: string,
    apiKey?: string
  ) {
    this.orderBook = new OrderBookClient(orderBookUrl, apiKey);
    this.contract = new ContractClient(rpcUrl, contractId);
    this.ws = new WebSocketClient(orderBookUrl.replace('http', 'ws'));
  }

  async submitOrder(order: Order, signature: string): Promise<{ id: string; order: OrderWithStatus }> {
    return this.orderBook.submitOrder(
      {
        maker: order.maker,
        token_in: order.tokenIn,
        token_out: order.tokenOut,
        amount_in: order.amountIn.toString(),
        min_amount_out: order.minAmountOut.toString(),
        expiry: order.expiry,
        nonce: Number(order.nonce),
        keeper_fee: order.keeperFee.toString(),
        preferred_dex: order.preferredDex,
      },
      signature
    );
  }

  async cancelOrder(orderId: string, keypair: Keypair): Promise<void> {
    await this.orderBook.cancelOrder(orderId, keypair);
  }

  async isFillable(orderId: string): Promise<{ fillable: boolean; expectedOut: bigint }> {
    const order = await this.orderBook.getOrder(orderId);
    const expectedOut = await this.contract.simulateSettlement({
      maker: order.maker,
      token_in: order.token_in,
      token_out: order.token_out,
      amount_in: BigInt(order.amount_in),
      min_amount_out: BigInt(order.min_amount_out),
      expiry: order.expiry,
      nonce: BigInt(order.nonce),
      keeper_fee: BigInt(order.keeper_fee),
      preferred_dex: order.preferred_dex,
    });

    return {
      fillable: expectedOut >= BigInt(order.min_amount_out),
      expectedOut,
    };
  }

  subscribeToFeed(handler: (event: OrderEvent) => void): () => void {
    const unsubscribers = [
      this.ws.on('order_created', handler),
      this.ws.on('order_filled', handler),
      this.ws.on('order_cancelled', handler),
      this.ws.on('order_expired', handler),
    ];

    return () => unsubscribers.forEach((fn) => fn());
  }

  async connectWebSocket(): Promise<void> {
    await this.ws.connect();
  }

  disconnectWebSocket(): void {
    this.ws.disconnect();
  }

  static fromEnv(): LimitOrderClient {
    const orderBookUrl = process.env.NEXT_PUBLIC_ORDER_BOOK_URL ?? 'http://localhost:3001';
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://soroban-testnet.stellar.org';
    const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID ?? '';

    return new LimitOrderClient(orderBookUrl, rpcUrl, contractId);
  }
}