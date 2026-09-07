// components/charts/DalaTrendChart.tsx
'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { MetricEntry } from '@/types';

interface DalaTrendChartProps {
  metrics: MetricEntry[];
  title: string;
  subtitle?: string;
}

type ChartViewMode = 'spend' | 'volume' | 'cpl';

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
  cpl: {
    label: 'CPL ($)',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

export function DalaTrendChart({ metrics, title, subtitle }: DalaTrendChartProps) {
  const [viewMode, setViewMode] = React.useState<ChartViewMode>('spend');

  // Sort by date
  const sorted = React.useMemo(() => {
    return [...metrics].sort(
      (a, b) => new Date(a.reporting_period).getTime() - new Date(b.reporting_period).getTime()
    );
  }, [metrics]);

  // Aggregate by date
  const data = React.useMemo(() => {
    const dateMap = new Map<string, {
      date: string;
      adSpend: number;
      leads: number;
      conversions: number;
      cpl: number;
    }>();

    sorted.forEach(m => {
      const rawDate = new Date(m.reporting_period);
      const key = rawDate.toISOString().split('T')[0];
      const displayDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dateMap.has(key)) {
        dateMap.set(key, {
          date: displayDate,
          adSpend: m.ad_spend,
          leads: m.leads,
          conversions: m.conversions,
          cpl: m.cost_per_lead || 0,
        });
      } else {
        const existing = dateMap.get(key)!;
        existing.adSpend += m.ad_spend;
        existing.leads += m.leads;
        existing.conversions += m.conversions;
        existing.cpl = existing.leads > 0 ? existing.adSpend / existing.leads : 0;
      }
    });

    return Array.from(dateMap.values());
  }, [sorted]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No performance data available for this period
      </div>
    );
  }

  const viewLabels: Record<ChartViewMode, string> = {
    spend: 'Ad spend investment over time',
    volume: 'Lead and conversion volume over time',
    cpl: 'Cost per lead efficiency over time',
  };

  const tabs: { id: ChartViewMode; label: string }[] = [
    { id: 'spend', label: 'SPEND' },
    { id: 'volume', label: 'VOLUME' },
    { id: 'cpl', label: 'CPL' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {subtitle || viewLabels[viewMode]}
          </p>
        </div>

        {/* Segmented control */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wider transition-all duration-150 cursor-pointer ${
                viewMode === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="min-h-[320px] w-full aspect-auto">
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-100"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickMargin={8}
            className="text-[11px] font-medium text-slate-500"
          />

          {viewMode === 'spend' && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px] font-medium text-slate-500"
              tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            />
          )}

          {viewMode === 'volume' && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px] font-medium text-slate-500"
              tickFormatter={v => `${v}`}
            />
          )}

          {viewMode === 'cpl' && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px] font-medium text-slate-500"
              tickFormatter={v => `$${v}`}
            />
          )}

          <ChartTooltip content={<ChartTooltipContent />} />

          {viewMode === 'spend' && (
            <Line
              type="monotone"
              dataKey="adSpend"
              stroke="var(--color-adSpend)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--color-adSpend)', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: 'var(--color-adSpend)', strokeWidth: 3, fill: '#fff' }}
            />
          )}

          {viewMode === 'volume' && (
            <>
              <Line
                type="monotone"
                dataKey="leads"
                stroke="var(--color-leads)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--color-leads)', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, stroke: 'var(--color-leads)', strokeWidth: 3, fill: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="var(--color-conversions)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--color-conversions)', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, stroke: 'var(--color-conversions)', strokeWidth: 3, fill: '#fff' }}
              />
            </>
          )}

          {viewMode === 'cpl' && (
            <Line
              type="monotone"
              dataKey="cpl"
              stroke="var(--color-cpl)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--color-cpl)', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: 'var(--color-cpl)', strokeWidth: 3, fill: '#fff' }}
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
