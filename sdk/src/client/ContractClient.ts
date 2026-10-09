import { rpc, Keypair } from '@stellar/stellar-sdk';

export class ContractClient {
  constructor(
    private readonly rpcUrl: string,
    private readonly contractId: string,
    private readonly networkPassphrase: string = 'Test SDF Network ; September 2015'
  ) {}

  async isFilled(maker: string, nonce: bigint): Promise<boolean> {
    const server = new rpc.Server(this.rpcUrl);
    const sourceKeypair = Keypair.random(); // for simulation only

    const tx = new rpc.Transaction(
      await server.getAccount(sourceKeypair.publicKey()),
      { fee: '100000', networkPassphrase: this.networkPassphrase }
    ).addOperation(
      rpc.xdr.Operation.invokeHostFunction({
        function: rpc.xdr.HostFunction.hostFunctionTypeInvokeContract({
          contractAddress: this.scAddress(this.contractId),
          functionName: 'is_filled',
          args: [this.scString(maker), this.scU64(nonce)],
        }),
      })
    );

    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const returnValue = simResult.result?.retval;
    if (!returnValue) return false;

    return returnValue.b() === true;
  }

  async simulateSettlement(order: {
    maker: string;
    token_in: string;
    token_out: string;
    amount_in: bigint;
    min_amount_out: bigint;
    expiry: number;
    nonce: bigint;
    keeper_fee: bigint;
    preferred_dex: string | null;
  }): Promise<bigint> {
    const server = new rpc.Server(this.rpcUrl);
    const sourceKeypair = Keypair.random();

    const orderXdr = this.buildOrderXdr(order);

    const tx = new rpc.Transaction(
      await server.getAccount(sourceKeypair.publicKey()),
      { fee: '100000', networkPassphrase: this.networkPassphrase }
    ).addOperation(
      rpc.xdr.Operation.invokeHostFunction({
        function: rpc.xdr.HostFunction.hostFunctionTypeInvokeContract({
          contractAddress: this.scAddress(this.contractId),
          functionName: 'simulate_settlement',
          args: [orderXdr],
        }),
      })
    );

    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const returnValue = simResult.result?.retval;
    if (!returnValue) return 0n;

    return this.readI128(returnValue);
  }

  private buildOrderXdr(order: any): rpc.xdr.ScVal {
    return rpc.xdr.ScVal.scvVec([
      this.scString(order.maker),
      this.scString(order.token_in),
      this.scString(order.token_out),
      this.scI128(order.amount_in),
      this.scI128(order.min_amount_out),
      this.scU64(BigInt(order.expiry)),
      this.scU64(order.nonce),
      this.scI128(order.keeper_fee),
      order.preferred_dex
        ? rpc.xdr.ScVal.scvVec([rpc.xdr.ScVal.scvSymbol('some'), this.scString(order.preferred_dex)])
        : rpc.xdr.ScVal.scvSymbol('none'),
    ]);
  }

  private scString(s: string): rpc.xdr.ScVal {
    return rpc.xdr.ScVal.scvString(s);
  }

  private scI128(v: bigint): rpc.xdr.ScVal {
    const lo = v & 0xffffffffffffffffn;
    const hi = (v >> 64n) & 0xffffffffffffffffn;
    return rpc.xdr.ScVal.scvI128(rpc.xdr.Int128.fromParts(hi, lo));
  }

  private scU64(v: bigint): rpc.xdr.ScVal {
    return rpc.xdr.ScVal.scvU64(v);
  }

  private scAddress(addr: string): rpc.xdr.ScVal {
    return rpc.xdr.ScVal.scvAddress(this.decodeAddress(addr));
  }

  private decodeAddress(addr: string): rpc.xdr.ScAddress {
    if (addr.startsWith('G')) {
      return rpc.xdr.ScAddress.scAddressTypeAccount(
        rpc.xdr.AccountId.accountIdTypeEd25519(Keypair.fromPublicKey(addr).rawPublicKey())
      );
    }
    return rpc.xdr.ScAddress.scAddressTypeContract(
      rpc.xdr.ContractId.contractIdTypeContract(Keypair.fromPublicKey(addr).rawPublicKey())
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