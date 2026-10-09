import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { CursorStore } from './CursorStore';
import { EventParser, ParsedEvent } from './EventParser';
import pino from 'pino';

const logger = pino({ name: 'HorizonPoller' });

export interface HorizonEvent {
  id: string;
  paging_token: string;
  type: string;
  contract_id: string;
  topic: string[];
  value: { xdr: string };
  ledger: number;
  created_at: string;
}

export class HorizonPoller {
  private client: AxiosInstance;
  private cursorStore: CursorStore;
  private eventParser: EventParser;
  private running = false;
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    cursorStore: CursorStore,
    eventParser: EventParser,
    private readonly horizonUrl: string = config.HORIZON_URL,
    private readonly contractId: string = config.CONTRACT_ID,
    private readonly pollIntervalMs: number = config.POLL_INTERVAL_MS
  ) {
    this.client = axios.create({
      baseURL: horizonUrl,
      timeout: 30000,
    });
    this.cursorStore = cursorStore;
    this.eventParser = eventParser;
  }

  async start(): Promise<void> {
    if (this.running) return;

    const cursor = await this.cursorStore.load();
    logger.info({ cursor }, 'Starting Horizon poller');
    this.running = true;

    await this.poll(cursor);
    this.interval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.running = false;
    logger.info('Horizon poller stopped');
  }

  private async poll(cursor?: string): Promise<void> {
    try {
      const params: Record<string, string> = {
        contract_id: this.contractId,
        limit: '200',
        order: 'asc',
      };

      if (cursor && cursor !== 'now') {
        params.cursor = cursor;
      }

      const response = await this.client.get<{ _embedded: { records: HorizonEvent[] } }>(
        '/events',
        { params }
      );

      const events = response.data._embedded?.records ?? [];
      logger.debug({ count: events.length }, 'Fetched events from Horizon');

      for (const event of events) {
        const parsed = this.eventParser.parse(event);
        if (parsed) {
          await this.eventParser.handle(parsed);
        }
        await this.cursorStore.save(event.paging_token);
      }
    } catch (error) {
      logger.error({ err: error }, 'Polling failed');
    }
  }
}