import axios from 'axios';
import { Severity, AlertContext } from './AlertManager';

export class SlackAlert {
  constructor(private readonly webhookUrl: string) {}

  async send(payload: { severity: Severity; message: string; context: AlertContext; timestamp: string }): Promise<void> {
    const color = this.getColor(payload.severity);
    const fields = Object.entries(payload.context).map(([key, value]) => ({
      title: key,
      value: String(value),
      short: true,
    }));

    await axios.post(this.webhookUrl, {
      attachments: [
        {
          color,
          title: `Soroban Keeper Alert [${payload.severity.toUpperCase()}]`,
          text: payload.message,
          fields,
          footer: 'Soroban Limit Order Protocol',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    });
  }

  private getColor(severity: Severity): string {
    switch (severity) {
      case 'info':
        return '#36a64f';
      case 'warning':
        return '#ff9900';
      case 'critical':
        return '#ff0000';
    }
  }
}