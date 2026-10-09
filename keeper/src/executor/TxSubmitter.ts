import { rpc, Keypair } from '@stellar/stellar-sdk';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'TxSubmitter' });

export interface SubmitResult {
  success: boolean;
  txHash: string;
  resultXdr?: string;
  error?: string;
}

export class TxSubmitter {
  constructor(
    private readonly rpcUrl: string = config.RPC_URL,
    private readonly networkPassphrase: string = config.NETWORK_PASSPHRASE
  ) {}

  async submit(tx: any): Promise<SubmitResult> {
    const server = new rpc.Server(this.rpcUrl);
    const sourceKeypair = Keypair.fromSecret(config.KEEPER_SECRET_KEY);

    tx.sign(sourceKeypair);
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const sendResult = await server.sendTransaction(tx);
        logger.debug({ attempt, status: sendResult.status }, 'Transaction sent');

        if (sendResult.status === 'ERROR') {
          const errorMsg = sendResult.errorResultXdr
            ? sendResult.errorResultXdr.toXDR('base64')
            : 'Unknown error';
          logger.warn({ attempt, error: errorMsg }, 'Transaction rejected');

          if (attempt < maxAttempts && this.isFeeError(errorMsg)) {
            logger.info('Fee error detected, bumping fee by 25% and retrying');
            const newFee = Math.ceil(Number(tx.fee) * 1.25).toString();
            tx.fee = newFee;
            continue;
          }
          return { success: false, txHash: sendResult.hash, error: errorMsg };
        }

        const result = await this.pollForResult(server, sendResult.hash);
        return result;
      } catch (error) {
        logger.warn({ attempt, err: error }, 'Submit attempt failed');
        if (attempt >= maxAttempts) {
          return { success: false, txHash: '', error: String(error) };
        }
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    return { success: false, txHash: '', error: 'Max retries exceeded' };
  }

  private async pollForResult(server: rpc.Server, hash: string): Promise<SubmitResult> {
    const startTime = Date.now();
    const timeout = 30000;
    const interval = 2000;

    while (Date.now() - startTime < timeout) {
      try {
        const status = await server.getTransaction(hash);
        if (status.status === 'SUCCESS') {
          logger.info({ hash, attempts: Math.ceil((Date.now() - startTime) / interval) }, 'Transaction confirmed');
          return {
            success: true,
            txHash: hash,
            resultXdr: status.resultXdr,
          };
        }
        if (status.status === 'FAILED') {
          const error = status.resultXdr?.toXDR('base64') ?? 'Transaction failed';
          logger.error({ hash, error }, 'Transaction failed');
          return { success: false, txHash: hash, error };
        }
      } catch {
        // Transaction not yet in ledger, continue polling
      }
      await this.sleep(interval);
    }

    logger.error({ hash }, 'Transaction polling timeout');
    return { success: false, txHash: hash, error: 'Polling timeout' };
  }

  private isFeeError(errorXdr: string): boolean {
    return errorXdr.includes('txINSUFFICIENT_FEE') || errorXdr.includes('txINSUFFICIENT_BALANCE');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}