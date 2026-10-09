import { rpc } from '@stellar/stellar-sdk';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'AquariusPricer' });

export class AquariusPricer {
  constructor(
    private readonly rpcUrl: string = config.RPC_URL,
    private readonly contractId: string = 'CA...' // TODO: real Aquarius pool address
  ) {}

  async getQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<bigint> {
    try {
      const server = new rpc.Server(this.rpcUrl);
      const sourceKeypair = rpc.Keypair.fromSecret(config.KEEPER_SECRET_KEY);

      const tx = new rpc.Transaction(
        await server.getAccount(sourceKeypair.publicKey()),
        { fee: '100000', networkPassphrase: config.NETWORK_PASSPHRASE }
      ).addOperation(
        rpc.xdr.Operation.invokeHostFunction({
          function: rpc.xdr.HostFunction.hostFunctionTypeInvokeContract({
            contractAddress: this.scAddress(this.contractId),
            functionName: 'query_output',
            args: [
              this.scString(tokenIn),
              this.scString(tokenOut),
              this.scI128(amountIn),
            ],
          }),
        })
      );

      const simResult = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simResult)) {
        return 0n;
      }

      const returnValue = simResult.result?.retval;
      if (!returnValue) return 0n;

      return this.readI128(returnValue);
    } catch (error) {
      logger.debug({ err: error, tokenIn, tokenOut }, 'Aquarius quote failed');
      return 0n;
    }
  }

  private scString(s: string): rpc.xdr.ScVal {
    return rpc.xdr.ScVal.scvString(s);
  }

  private scI128(v: bigint): rpc.xdr.ScVal {
    const lo = v & 0xffffffffffffffffn;
    const hi = (v >> 64n) & 0xffffffffffffffffn;
    return rpc.xdr.ScVal.scvI128(rpc.xdr.Int128.fromParts(hi, lo));
  }

  private scAddress(addr: string): rpc.xdr.ScVal {
    return rpc.xdr.ScVal.scvAddress(this.decodeAddress(addr));
  }

  private decodeAddress(addr: string): rpc.xdr.ScAddress {
    if (addr.startsWith('G')) {
      return rpc.xdr.ScAddress.scAddressTypeAccount(
        rpc.xdr.AccountId.accountIdTypeEd25519(rpc.Keypair.fromPublicKey(addr).rawPublicKey())
      );
    }
    return rpc.xdr.ScAddress.scAddressTypeContract(
      rpc.xdr.ContractId.contractIdTypeContract(rpc.Keypair.fromPublicKey(addr).rawPublicKey())
    );
  }

  private readI128(val: rpc.xdr.ScVal): bigint {
    const i128 = val.i128();
    if (!i128) return 0n;
    const hi = BigInt(i128.hi().toString());
    const lo = BigInt(i128.lo().toString());
    return (hi << 64n) | lo;
  }
}