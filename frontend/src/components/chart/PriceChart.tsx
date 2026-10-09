'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function PriceChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Placeholder for lightweight-charts integration
    // import { createChart } from 'lightweight-charts';
    // const chart = createChart(chartRef.current!, { width: 400, height: 300 });
    // const candleSeries = chart.addCandlestickSeries();
    // candleSeries.setData([
    //   { time: '2024-01-01', open: 100, high: 110, low: 95, close: 105 },
    // ]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[300px] bg-muted rounded" />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Chart placeholder - integrate lightweight-charts
        </p>
      </CardContent>
    </Card>
  );
}