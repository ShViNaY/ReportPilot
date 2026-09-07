// components/charts/TrendChart.tsx
'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { MetricEntry } from '@/types';

interface TrendChartProps {
  metrics: MetricEntry[];
  title: string;
}

const chartConfig = {
  adSpend: {
    label: 'Ad Spend ($)',
    color: 'var(--chart-1)',
  },
  leads: {
    label: 'Leads',
    color: 'var(--chart-2)',
  },
  conversions: {
    label: 'Conversions',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function TrendChart({ metrics, title }: TrendChartProps) {
  // Sort by date ascending
  const sorted = React.useMemo(() => {
    return [...metrics].sort(
      (a, b) =>
        new Date(a.reporting_period).getTime() -
        new Date(b.reporting_period).getTime()
    );
  }, [metrics]);

  // Aggregate or format data by date for chart
  const data = React.useMemo(() => {
    const map = new Map<string, {
      date: string;
      adSpend: number;
      leads: number;
      conversions: number;
    }>();

    sorted.forEach((m) => {
      const d = new Date(m.reporting_period);
      const key = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!map.has(key)) {
        map.set(key, {
          date: displayDate,
          adSpend: m.ad_spend,
          leads: m.leads,
          conversions: m.conversions,
        });
      } else {
        const entry = map.get(key)!;
        entry.adSpend += m.ad_spend;
        entry.leads += m.leads;
        entry.conversions += m.conversions;
      }
    });

    return Array.from(map.values());
  }, [sorted]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400 text-sm">
        No performance data available for this range
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Continuous trajectory over reporting periods</p>
        </div>
      </div>

      {/* shadcn Chart Container */}
      <ChartContainer config={chartConfig} className="min-h-[320px] w-full aspect-auto">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillAdSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-adSpend)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-adSpend)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillConversions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-conversions)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-conversions)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100" />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickMargin={8}
            className="text-[11px] font-medium text-slate-500"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px] font-medium text-slate-500"
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
            }
          />

          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(label) => `Date: ${label}`}
              />
            }
          />

          <ChartLegend content={<ChartLegendContent />} />

          <Area
            type="monotone"
            dataKey="adSpend"
            stroke="var(--color-adSpend)"
            fill="url(#fillAdSpend)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="var(--color-leads)"
            fill="url(#fillLeads)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="conversions"
            stroke="var(--color-conversions)"
            fill="url(#fillConversions)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}