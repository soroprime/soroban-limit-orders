export type OrderEventType = 'order_created' | 'order_filled' | 'order_cancelled' | 'order_expired';

export interface OrderEvent {
  event: OrderEventType;
  order?: any;
  order_id?: string;
  tx_hash?: string;
}

export type EventHandler = (event: OrderEvent) => void;

export class WebSocketClient {
  private ws?: WebSocket;
  private handlers = new Map<OrderEventType, Set<EventHandler>>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private shouldReconnect = true;

  constructor(private readonly wsUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}/feed`);

      this.ws.onopen = () => {
        console.log('[WebSocketClient] Connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OrderEvent;
          this.emit(data.event, data);
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WebSocketClient] Error:', err);
        reject(err);
      };

      this.ws.onclose = () => {
        console.log('[WebSocketClient] Disconnected');
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), 5000);
        }
      };
    });
  }

  subscribe(pair?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ subscribe: pair }));
    }
  }

  on(event: OrderEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  off(event: OrderEventType, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: OrderEventType, data: OrderEvent): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}