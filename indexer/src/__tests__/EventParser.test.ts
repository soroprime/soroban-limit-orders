import { xdr } from '@stellar/stellar-sdk';
import { EventParser } from '../horizon/EventParser';
import { FillProcessor } from '../processors/FillProcessor';
import { CancelProcessor } from '../processors/CancelProcessor';
import { ExpireProcessor } from '../processors/ExpireProcessor';

const mockFillProcessor = { process: jest.fn() } as unknown as FillProcessor;
const mockCancelProcessor = { process: jest.fn() } as unknown as CancelProcessor;
const mockExpireProcessor = { process: jest.fn() } as unknown as ExpireProcessor;

describe('EventParser', () => {
  let parser: EventParser;

  beforeEach(() => {
    parser = new EventParser(mockFillProcessor, mockCancelProcessor, mockExpireProcessor);
    jest.clearAllMocks();
  });

  function createFillEventXdr(): string {
    const orderId = xdr.ScVal.scvString('order-123');
    const maker = xdr.ScVal.scvString('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    const nonce = xdr.ScVal.scvU64(1);
    const amountOut = xdr.ScVal.scvI128(xdr.Int128.fromParts(0, 1000000));
    const keeperFee = xdr.ScVal.scvI128(xdr.Int128.fromParts(0, 10));
    const dex = xdr.ScVal.scvString('soroswap');
    const vec = xdr.ScVal.scvVec([orderId, maker, nonce, amountOut, keeperFee, dex]);
    return vec.toXDR('base64');
  }

  function createCancelEventXdr(): string {
    const orderId = xdr.ScVal.scvString('order-123');
    const maker = xdr.ScVal.scvString('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    const nonce = xdr.ScVal.scvU64(1);
    const vec = xdr.ScVal.scvVec([orderId, maker, nonce]);
    return vec.toXDR('base64');
  }

  it('parses fill event correctly', () => {
    const event = {
      id: 'event-1',
      paging_token: '123',
      type: 'contract',
      contract_id: 'CA...',
      topic: ['order_filled'],
      value: { xdr: createFillEventXdr() },
      ledger: 1,
      created_at: new Date().toISOString(),
    };

    const parsed = parser.parse(event);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe('fill');
    expect(parsed!.orderId).toBe('order-123');
    expect(parsed!.maker).toBe('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
    expect(parsed!.nonce).toBe(1);
    expect(parsed!.amountOut).toBe(1000000n);
  });

  it('parses cancel event correctly', () => {
    const event = {
      id: 'event-2',
      paging_token: '124',
      type: 'contract',
      contract_id: 'CA...',
      topic: ['order_cancelled'],
      value: { xdr: createCancelEventXdr() },
      ledger: 1,
      created_at: new Date().toISOString(),
    };

    const parsed = parser.parse(event);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe('cancel');
    expect(parsed!.orderId).toBe('order-123');
  });

  it('returns null for unknown event type', () => {
    const event = {
      id: 'event-3',
      paging_token: '125',
      type: 'contract',
      contract_id: 'CA...',
      topic: ['unknown_event'],
      value: { xdr: 'AAAA' },
      ledger: 1,
      created_at: new Date().toISOString(),
    };

    const parsed = parser.parse(event);
    expect(parsed).toBeNull();
  });
});