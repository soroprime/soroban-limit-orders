import { Executor } from '../executor/Executor';
import { OrderQueue } from '../OrderQueue';
import { TxBuilder } from '../executor/TxBuilder';
import { TxSubmitter } from '../executor/TxSubmitter';
import { ResultParser } from '../executor/ResultParser';
import { MockRpc } from '../mocks/MockRpc';
import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';

function makeOrder(overrides: Partial<OrderWithStatus> = {}): OrderWithStatus {
  return {
    id: `order-${Date.now()}-${Math.random()}`,
    maker: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    token_in: 'CAAAAA',
    token_out: 'CBBBBB',
    amount_in: '1000',
    min_amount_out: '900',
    expiry: Math.floor(Date.now() / 1000) + 86400,
    nonce: 1,
    keeper_fee: '10',
    preferred_dex: null,
    signature: 'sig',
    status: 'pending',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    fill_tx_hash: null,
    fill_price: null,
    fill_timestamp: null,
    ...overrides,
  };
}

describe('Executor', () => {
  let queue: OrderQueue;
  let mockRpc: MockRpc;
  let executor: Executor;

  beforeEach(() => {
    queue = new OrderQueue();
    mockRpc = new MockRpc();

    const txBuilder = new TxBuilder();
    const txSubmitter = new TxSubmitter();
    const resultParser = new ResultParser();

    // Mock the submitter to use our mock RPC
    jest.spyOn(txSubmitter, 'submit').mockImplementation(async (tx) => {
      const sendResult = await mockRpc.sendTransaction(tx);
      if (sendResult.status === 'ERROR') {
        return { success: false, txHash: sendResult.hash, error: 'failed' };
      }
      const result = await mockRpc.getTransaction(sendResult.hash);
      return {
        success: result.status === 'SUCCESS',
        txHash: sendResult.hash,
        resultXdr: result.resultXdr,
      };
    });

    jest.spyOn(txBuilder, 'buildSettleTx').mockResolvedValue({
      tx: {} as any,
      simResult: {} as any,
    });

    executor = new Executor(queue, txBuilder, txSubmitter, resultParser, 1, 'http://localhost:3001');
  });

  afterEach(() => {
    executor.stop();
  });

  it('dequeues and attempts settlement', async () => {
    const order = makeOrder({ id: '1' });
    queue.enqueue(order);

    mockRpc.setSubmitResponse('mock-hash', { status: 'SUCCESS', resultXdr: 'AAAA' });

    executor.start();
    await new Promise((r) => setTimeout(r, 100));

    expect(queue.size()).toBe(0);
  });

  it('re-queues on failure', async () => {
    const order = makeOrder({ id: '1' });
    queue.enqueue(order);

    mockRpc.setSubmitResponse('mock-hash', { status: 'FAILED', resultXdr: 'BBBB' });

    executor.start();
    await new Promise((r) => setTimeout(r, 100));

    // Should be re-queued after backoff
    await new Promise((r) => setTimeout(r, 31000));
    expect(queue.size()).toBe(1);
  });
});