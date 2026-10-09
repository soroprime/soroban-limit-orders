import axios, { AxiosInstance } from 'axios';
import { Keypair } from '@stellar/stellar-sdk';
import {
  SubmitOrderRequest,
  SubmitOrderResponse,
  OrderWithStatus,
  OrderFilters,
  PaginatedOrders,
  PairRow,
  GlobalStats,
  PairStats,
  HealthResponse,
  ReadyResponse,
  CancelOrderRequest,
} from '../types/Api';

export class OrderBookClient {
  private client: AxiosInstance;

  constructor(private readonly baseUrl: string, private readonly apiKey?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (apiKey) {
      this.client.defaults.headers.common['X-API-Key'] = apiKey;
    }
  }

  async submitOrder(order: SubmitOrderRequest['order'], signature: string): Promise<SubmitOrderResponse> {
    const response = await this.client.post<SubmitOrderResponse>('/orders', { order, signature });
    return response.data;
  }

  async getOrder(id: string): Promise<OrderWithStatus> {
    const response = await this.client.get<{ order: OrderWithStatus }>(`/orders/${id}`);
    return response.data.order;
  }

  async listOrders(filters: OrderFilters = {}): Promise<PaginatedOrders> {
    const params = new URLSearchParams();
    if (filters.maker) params.set('maker', filters.maker);
    if (filters.tokenIn) params.set('token_in', filters.tokenIn);
    if (filters.tokenOut) params.set('token_out', filters.tokenOut);
    if (filters.status) params.set('status', filters.status);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('offset', String(filters.offset));

    const response = await this.client.get<PaginatedOrders>(`/orders?${params.toString()}`);
    return response.data;
  }

  async cancelOrder(id: string, keypair: Keypair): Promise<void> {
    const payload = { signature: keypair.sign(Buffer.from(id)).toString('base64') };
    await this.client.delete(`/orders/${id}`, { data: payload });
  }

  async getPairs(): Promise<PairRow[]> {
    const response = await this.client.get<{ pairs: PairRow[] }>('/pairs');
    return response.data.pairs;
  }

  async getStats(): Promise<GlobalStats> {
    const response = await this.client.get<{ stats: GlobalStats }>('/stats');
    return response.data.stats;
  }

  async getPairStats(tokenIn: string, tokenOut: string): Promise<PairStats> {
    const response = await this.client.get<{ stats: PairStats }>(`/stats?token_in=${tokenIn}&token_out=${tokenOut}`);
    return response.data.stats;
  }

  async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async ready(): Promise<ReadyResponse> {
    const response = await this.client.get<ReadyResponse>('/ready');
    return response.data;
  }
}