import { OrderWithStatus } from '@soroban-limit-orders/sdk/types/Api';

export class MockRpc {
  private simulateResponses = new Map<string, any>();
  private submitResponses = new Map<string, any>();

  setSimulateResponse(contractMethod: string, response: any): void {
    this.simulateResponses.set(contractMethod, response);
  }

  setSubmitResponse(hash: string, response: any): void {
    this.submitResponses.set(hash, response);
  }

  async simulateTransaction(tx: any): Promise<any> {
    // Extract method name from transaction
    return this.simulateResponses.get('default') ?? { result: { retval: null } };
  }

  async sendTransaction(tx: any): Promise<any> {
    return { status: 'PENDING', hash: 'mock-hash-' + Date.now() };
  }

  async getTransaction(hash: string): Promise<any> {
    return this.submitResponses.get(hash) ?? { status: 'SUCCESS', resultXdr: 'AAAA' };
  }
}