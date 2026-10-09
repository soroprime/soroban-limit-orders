import { xdr, rpc } from '@stellar/stellar-sdk';
import { HorizonEvent } from './HorizonPoller';
import { FillProcessor } from '../processors/FillProcessor';
import { CancelProcessor } from '../processors/CancelProcessor';
import { ExpireProcessor } from '../processors/ExpireProcessor';
import pino from 'pino';

const logger = pino({ name: 'EventParser' });

export type ParsedEvent =
  | { type: 'fill'; orderId: string; maker: string; nonce: number; amountOut: bigint; keeperFee: bigint; dex: string; txHash: string }
  | { type: 'cancel'; orderId: string; maker: string; nonce: number }
  | { type: 'expire'; orderId: string; maker: string; nonce: number };

export class EventParser {
  constructor(
    private readonly fillProcessor: FillProcessor,
    private readonly cancelProcessor: CancelProcessor,
    private readonly expireProcessor: ExpireProcessor
  ) {}

  parse(event: HorizonEvent): ParsedEvent | null {
    try {
      const topic = event.topic[0];
      const valueXdr = event.value.xdr;

      switch (topic) {
        case 'order_filled':
          return this.parseFill(valueXdr, event.id);
        case 'order_cancelled':
          return this.parseCancel(valueXdr);
        case 'order_expired':
          return this.parseExpire(valueXdr);
        default:
          logger.debug({ topic }, 'Unknown event type');
          return null;
      }
    } catch (error) {
      logger.error({ err: error, eventId: event.id }, 'Failed to parse event');
      return null;
    }
  }

  async handle(parsed: ParsedEvent): Promise<void> {
    switch (parsed.type) {
      case 'fill':
        await this.fillProcessor.process(parsed);
        break;
      case 'cancel':
        await this.cancelProcessor.process(parsed);
        break;
      case 'expire':
        await this.expireProcessor.process(parsed);
        break;
    }
  }

  private parseFill(xdrBase64: string, txHash: string): ParsedEvent {
    const value = xdr.ScVal.fromXDR(xdrBase64, 'base64');
    const vec = value.vec();
    if (!vec || vec.length < 6) {
      throw new Error('Invalid fill event format');
    }

    return {
      type: 'fill',
      orderId: this.readString(vec[0]),
      maker: this.readString(vec[1]),
      nonce: Number(this.readU64(vec[2])),
      amountOut: this.readI128(vec[3]),
      keeperFee: this.readI128(vec[4]),
      dex: this.readString(vec[5]),
      txHash,
    };
  }

  private parseCancel(xdrBase64: string): ParsedEvent {
    const value = xdr.ScVal.fromXDR(xdrBase64, 'base64');
    const vec = value.vec();
    if (!vec || vec.length < 3) {
      throw new Error('Invalid cancel event format');
    }

    return {
      type: 'cancel',
      orderId: this.readString(vec[0]),
      maker: this.readString(vec[1]),
      nonce: Number(this.readU64(vec[2])),
    };
  }

  private parseExpire(xdrBase64: string): ParsedEvent {
    const value = xdr.ScVal.fromXDR(xdrBase64, 'base64');
    const vec = value.vec();
    if (!vec || vec.length < 3) {
      throw new Error('Invalid expire event format');
    }

    return {
      type: 'expire',
      orderId: this.readString(vec[0]),
      maker: this.readString(vec[1]),
      nonce: Number(this.readU64(vec[2])),
    };
  }

  private readString(val: xdr.ScVal): string {
    return val.str()?.toString() ?? '';
  }

  private readU64(val: xdr.ScVal): bigint {
    return val.u64() ?? 0n;
  }

  private readI128(val: xdr.ScVal): bigint {
    const i128 = val.i128();
    if (!i128) return 0n;
    const hi = BigInt(i128.hi().toString());
    const lo = BigInt(i128.lo().toString());
    return (hi << 64n) | lo;
  }
}