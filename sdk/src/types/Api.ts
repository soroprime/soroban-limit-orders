import { OrderWithStatus, OrderStatus } from './Order';

export interface PaginatedOrders {
  orders: OrderWithStatus[];
}

export interface OrderFilters {
  maker?: string;
  tokenIn?: string;
  tokenOut?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface SubmitOrderRequest {
  order: {
    maker: string;
    token_in: string;
    token_out: string;
    amount_in: string;
    min_amount_out: string;
    expiry: number;
    nonce: number;
    keeper_fee: string;
    preferred_dex: string | null;
  };
  signature: string;
}

export interface SubmitOrderResponse {
  id: string;
  order: OrderWithStatus;
}

export interface CancelOrderRequest {
  signature: string;
}

export interface PairRow {
  token_in: string;
  token_out: string;
  order_count: number;
  volume_24h: number;
}

export interface GlobalStats {
  total_orders: number;
  filled_count: number;
  fill_rate: number;
  volume_24h: number;
}

export interface PairStats extends GlobalStats {
  token_in: string;
  token_out: string;
}

export interface HealthResponse {
  status: 'ok';
  version: string;
}

export interface ReadyResponse {
  status: 'ready' | 'unavailable';
}