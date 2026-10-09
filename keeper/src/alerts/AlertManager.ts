import { config } from '../config';
import { SlackAlert } from './SlackAlert';
import pino from 'pino';

const logger = pino({ name: 'AlertManager' });

export type Severity = 'info' | 'warning' | 'critical';

export interface AlertContext {
  [key: string]: unknown;
}

let slackAlert: SlackAlert | null = null;

if (config.SLACK_WEBHOOK_URL) {
  slackAlert = new SlackAlert(config.SLACK_WEBHOOK_URL);
}

let failedCount = 0;
let lastFailedReset = Date.now();

export class AlertManager {
  static alert(severity: Severity, message: string, context: AlertContext = {}): void {
    const payload = { severity, message, context, timestamp: new Date().toISOString() };

    logger.warn(payload, `Alert: ${message}`);

    if (slackAlert) {
      slackAlert.send(payload).catch((err) => {
        logger.error({ err }, 'Failed to send Slack alert');
      });
    }

    if (severity === 'critical') {
      logger.error(payload, 'CRITICAL ALERT');
    }
  }

  static checkQueueDepth(depth: number): void {
    if (depth > 100) {
      this.alert('warning', `Queue depth high: ${depth}`, { depth });
    }
  }

  static checkFailureRate(increment: number = 1): void {
    failedCount += increment;
    const now = Date.now();
    if (now - lastFailedReset > 60000) {
      failedCount = increment;
      lastFailedReset = now;
    }
    if (failedCount >= 5) {
      this.alert('critical', `High failure rate: ${failedCount} failures in 60s`, { failedCount });
    }
  }

  static async checkKeeperBalance(): Promise<void> {
    // TODO: Implement balance check via RPC
  }
}