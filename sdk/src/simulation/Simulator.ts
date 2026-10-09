import { rpc } from '@stellar/stellar-sdk';

export class Simulator {
  constructor(private readonly rpcUrl: string) {}

  async simulateTransaction(tx: rpc.Transaction): Promise<rpc.Api.SimulateTransactionResponse> {
    const server = new rpc.Server(this.rpcUrl);
    return server.simulateTransaction(tx);
  }
}