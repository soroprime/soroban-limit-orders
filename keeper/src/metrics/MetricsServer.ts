import { Registry, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config';
import express, { Request, Response } from 'express';
import pino from 'pino';

const logger = pino({ name: 'MetricsServer' });

const register = new Registry();
collectDefaultMetrics({ register });

export const ordersAttemptedTotal = new Counter({
  name: 'orders_attempted_total',
  help: 'Total number of settlement attempts',
  registers: [register],
});

export const ordersFilledTotal = new Counter({
  name: 'orders_filled_total',
  help: 'Total number of successful settlements',
  registers: [register],
});

export const ordersFailedTotal = new Counter({
  name: 'orders_failed_total',
  help: 'Total number of failed settlements',
  registers: [register],
});

export const ordersExpiredTotal = new Counter({
  name: 'orders_expired_total',
  help: 'Total number of orders expired',
  registers: [register],
});

export const ordersEnqueuedTotal = new Counter({
  name: 'orders_enqueued_total',
  help: 'Total number of orders enqueued for settlement',
  registers: [register],
});

export const queueDepth = new Gauge({
  name: 'queue_depth',
  help: 'Current number of orders in the settlement queue',
  registers: [register],
});

export const rpcLatencyMs = new Gauge({
  name: 'rpc_latency_ms',
  help: 'Rolling average of RPC call latency in milliseconds',
  registers: [register],
});

export const ordersFetchedTotal = new Counter({
  name: 'orders_fetched_total',
  help: 'Total number of orders fetched from order book',
  registers: [register],
});

export const metrics = {
  increment: (name: string, value: number = 1) => {
    const metric = register.getSingleMetric(name);
    if (metric && 'inc' in metric) {
      (metric as Counter).inc(value);
    }
  },
  gauge: (name: string, value: number) => {
    const metric = register.getSingleMetric(name);
    if (metric && 'set' in metric) {
      (metric as Gauge).set(value);
    }
  },
};

let server: ReturnType<typeof express> | null = null;

export async function startMetricsServer(): Promise<void> {
  if (server) return;

  const app = express();
  app.get('/metrics', async (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      res.send(await register.metrics());
    } catch (error) {
      res.status(500).send('Error generating metrics');
    }
  });

  server = app.listen(config.METRICS_PORT, () => {
    logger.info({ port: config.METRICS_PORT }, 'Metrics server started');
  });
}

export async function stopMetricsServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
    logger.info('Metrics server stopped');
  }
}

export { register };