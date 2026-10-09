import { Keypair, Transaction, xdr, rpc } from '@stellar/stellar-sdk';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'TxBuilder' });

export interface PreparedTx {
  tx: Transaction;
  simResult: rpc.Api.SimulateTransactionResponse;
}

export class TxBuilder {
  constructor(
    private readonly contractId: string = config.CONTRACT_ID,
    private readonly rpcUrl: string = config.RPC_URL,
    private readonly networkPassphrase: string = config.NETWORK_PASSPHRASE
  ) {}

  async buildSettleTx(
    order: {
      id: string;
      maker: string;
      token_in: string;
      token_out: string;
      amount_in: string;
      min_amount_out: string;
      expiry: number;
      nonce: number;
      keeper_fee: string;
      preferred_dex: string | null;
      signature: string;
    },
    dexAddress: string
  ): Promise<PreparedTx> {
    const server = new rpc.Server(this.rpcUrl);
    const sourceKeypair = Keypair.fromSecret(config.KEEPER_SECRET_KEY);
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());

    const orderXdr = this.buildOrderXdr(order);

    const tx = new Transaction(sourceAccount, {
      fee: '100000',
      networkPassphrase: this.networkPassphrase,
    }).addOperation(
      xdr.Operation.invokeHostFunction({
        function: xdr.HostFunction.hostFunctionTypeInvokeContract({
          contractAddress: this.scAddress(this.contractId),
          functionName: 'settle',
          args: [
            orderXdr,
            this.scBytes(Buffer.from(order.signature, 'base64')),
            this.scAddress(dexAddress),
          ],
        }),
      })
    );

    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${JSON.stringify(simResult.error)}`);
    }

    const preparedTx = rpc.assembleTransaction(tx, simResult);
    preparedTx.setTimeout(300);

    logger.debug({ orderId: order.id }, 'Built settle transaction');
    return { tx: preparedTx, simResult };
  }

  private buildOrderXdr(order: any): xdr.ScVal {
    return xdr.ScVal.scvVec([
      this.scString(order.maker),
      this.scString(order.token_in),
      this.scString(order.token_out),
      this.scI128(BigInt(order.amount_in)),
      this.scI128(BigInt(order.min_amount_out)),
      this.scU64(BigInt(order.expiry)),
      this.scU64(BigInt(order.nonce)),
      this.scI128(BigInt(order.keeper_fee)),
      order.preferred_dex
        ? xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('some'), this.scString(order.preferred_dex)])
        : xdr.ScVal.scvSymbol('none'),
    ]);
  }

  private scString(s: string): xdr.ScVal {
    return xdr.ScVal.scvString(s);
  }

  private scI128(v: bigint): xdr.ScVal {
    const lo = v & 0xffffffffffffffffn;
    const hi = (v >> 64n) & 0xffffffffffffffffn;
    return xdr.ScVal.scvI128(xdr.Int128.fromParts(hi, lo));
  }

  private scU64(v: bigint): xdr.ScVal {
    return xdr.ScVal.scvU64(v);
  }

  private scBytes(b: Buffer): xdr.ScVal {
    return xdr.ScVal.scvBytes(b);
  }

  private scAddress(addr: string): xdr.ScVal {
    return xdr.ScVal.scvAddress(this.decodeAddress(addr));
  }

  private decodeAddress(addr: string): xdr.ScAddress {
    if (addr.startsWith('G')) {
      return xdr.ScAddress.scAddressTypeAccount(
        xdr.AccountId.accountIdTypeEd25519(Keypair.fromPublicKey(addr).rawPublicKey())
      );
    }
    return xdr.ScAddress.scAddressTypeContract(
      xdr.ContractId.contractIdTypeContract(Keypair.fromPublicKey(addr).rawPublicKey())
    );
  }
}