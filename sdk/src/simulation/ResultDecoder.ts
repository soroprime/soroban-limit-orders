import { rpc, xdr } from '@stellar/stellar-sdk';

export class SimulationError extends Error {
  constructor(message: string, public readonly simResult: rpc.Api.SimulateTransactionErrorResponse) {
    super(message);
    this.name = 'SimulationError';
  }
}

export function decodeSimulationResult(response: rpc.Api.SimulateTransactionResponse): bigint {
  if (rpc.Api.isSimulationError(response)) {
    throw new SimulationError('Simulation failed', response);
  }

  const returnValue = response.result?.retval;
  if (!returnValue) return 0n;

  return readI128(returnValue);
}

function readI128(val: xdr.ScVal): bigint {
  const i128 = val.i128();
  if (!i128) return 0n;
  const hi = BigInt(i128.hi().toString());
  const lo = BigInt(i128.lo().toString());
  return (hi << 64n) | lo;
}