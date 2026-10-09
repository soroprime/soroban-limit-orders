import { rpc, xdr, Keypair } from '@stellar/stellar-sdk';
import { Quote } from '../types';

export class PriceQuoter {
  constructor(
    private readonly rpcUrl: string,
    private readonly networkPassphrase: string = 'Test SDF Network ; September 2015'
  ) {}

  async getQuote(
    dexContractId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<Quote> {
    const server = new rpc.Server(this.rpcUrl);
    const sourceKeypair = Keypair.random();

    // Try Soroswap interface first
    let quote = await this.trySoroswap(server, sourceKeypair, dexContractId, tokenIn, tokenOut, amountIn);
    if (quote > 0n) {
      return { dex: 'soroswap', amountOut: quote, priceImpact: 0 };
    }

    // Try Phoenix interface
    quote = await this.tryPhoenix(server, sourceKeypair, dexContractId, tokenIn, tokenOut, amountIn);
    if (quote > 0n) {
      return { dex: 'phoenix', amountOut: quote, priceImpact: 0 };
    }

    // Try Aquarius interface
    quote = await this.tryAquarius(server, sourceKeypair, dexContractId, tokenIn, tokenOut, amountIn);
    if (quote > 0n) {
      return { dex: 'aquarius', amountOut: quote, priceImpact: 0 };
    }

    return { dex: 'unknown', amountOut: 0n, priceImpact: 0 };
  }

  private async trySoroswap(
    server: rpc.Server,
    sourceKeypair: Keypair,
    contractId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> {
    try {
      const tx = new rpc.Transaction(
        await server.getAccount(sourceKeypair.publicKey()),
        { fee: '100000', networkPassphrase: this.networkPassphrase }
      ).addOperation(
        rpc.xdr.Operation.invokeHostFunction({
          function: rpc.xdr.HostFunction.hostFunctionTypeInvokeContract({
            contractAddress: this.scAddress(contractId),
            functionName: 'get_amounts_out',
            args: [this.scI128(amountIn), this.scVec([this.scString(tokenIn), this.scString(tokenOut)])],
          }),
        })
      );

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) return 0n;

      const amounts = sim.result?.retval?.vec();
      if (!amounts || amounts.length < 2) return 0n;

      return this.readI128(amounts[amounts.length - 1]);
    } catch {
      return 0n;
    }
  }

  private async tryPhoenix(
    server: rpc.Server,
    sourceKeypair: Keypair,
    contractId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> {
    try {
      const tx = new rpc.Transaction(
        await server.getAccount(sourceKeypair.publicKey()),
        { fee: '100000', networkPassphrase: this.networkPassphrase }
      ).addOperation(
        rpc.xdr.Operation.invokeHostFunction({
          function: rpc.xdr.HostFunction.hostFunctionTypeInvokeContract({
            contractAddress: this.scAddress(contractId),
            functionName: 'simulate_swap',
            args: [this.scI128(amountIn)],
          }),
        })
      );

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) return 0n;

      return this.readI128(sim.result?.retval!);
    } catch {
      return 0n;
    }
  }

  private async tryAquarius(
    server: rpc.Server,
    sourceKeypair: Keypair,
    contractId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> {
    try {
      const tx = new rpc.Transaction(
        await server.getAccount(sourceKeypair.publicKey()),
        { fee: '100000', networkPassphrase: this.networkPassphrase }
      ).addOperation(
        rpc.xdr.Operation.invokeHostFunction({
          function: rpc.xdr.HostFunction.hostFunctionTypeInvokeContract({
            contractAddress: this.scAddress(contractId),
            functionName: 'query_output',
            args: [this.scString(tokenIn), this.scString(tokenOut), this.scI128(amountIn)],
          }),
        })
      );

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) return 0n;

      return this.readI128(sim.result?.retval!);
    } catch {
      return 0n;
    }
  }

  private scString(s: string): xdr.ScVal {
    return xdr.ScVal.scvString(s);
  }

  private scI128(v: bigint): xdr.ScVal {
    const lo = v & 0xffffffffffffffffn;
    const hi = (v >> 64n) & 0xffffffffffffffffn;
    return xdr.ScVal.scvI128(xdr.Int128.fromParts(hi, lo));
  }

  private scVec(arr: xdr.ScVal[]): xdr.ScVal {
    return xdr.ScVal.scvVec(arr);
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

  private readI128(val: xdr.ScVal): bigint {
    const i128 = val.i128();
    if (!i128) return 0n;
    const hi = BigInt(i128.hi().toString());
    const lo = BigInt(i128.lo().toString());
    return (hi << 64n) | lo;
  }
}