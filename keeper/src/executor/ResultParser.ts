import { xdr } from '@stellar/stellar-sdk';

export interface SettlementResult {
  amountOut: bigint;
  keeperFee: bigint;
  dexUsed: string;
}

export class ResultParser {
  parse(resultXdr: string): SettlementResult {
    try {
      const result = xdr.TransactionResult.fromXDR(resultXdr, 'base64');
      const results = result.result().results();
      
      if (!results || results.length === 0) {
        throw new Error('No operation results in transaction');
      }

      const invokeResult = results[0].value();
      if (!invokeResult) {
        throw new Error('No invoke host function result');
      }

      const returnValue = invokeResult.returnValue();
      if (!returnValue) {
        throw new Error('No return value from settlement');
      }

      const vec = returnValue.vec();
      if (!vec || vec.length < 3) {
        throw new Error('Unexpected return value format');
      }

      const amountOut = this.readI128(vec[0]);
      const keeperFee = this.readI128(vec[1]);
      const dexUsed = this.readString(vec[2]);

      return { amountOut, keeperFee, dexUsed };
    } catch (error) {
      throw new Error(`Failed to parse settlement result: ${error}`);
    }
  }

  private readI128(val: xdr.ScVal): bigint {
    const i128 = val.i128();
    if (!i128) return 0n;
    const hi = BigInt(i128.hi().toString());
    const lo = BigInt(i128.lo().toString());
    return (hi << 64n) | lo;
  }

  private readString(val: xdr.ScVal): string {
    const str = val.str();
    return str ? str.toString() : '';
  }
}