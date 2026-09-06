// components/charts/DalaTrendChart.tsx
'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MetricEntry } from '@/types';

interface DalaTrendChartProps {
  metrics: MetricEntry[];
  title: string;
  subtitle?: string;
}

type ChartViewMode = 'spend' | 'volume' | 'cpl';

export function DalaTrendChart({ metrics, title, subtitle }: DalaTrendChartProps) {
  const [viewMode, setViewMode] = useState<ChartViewMode>('spend');

  // Sort by date
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.reporting_period).getTime() - new Date(b.reporting_period).getTime()
  );

  // Aggregate by date
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

  const data = Array.from(dateMap.values());

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 dala-body" style={{ color: 'var(--dala-ash-gray)' }}>
        No performance data available for this period
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: '#111111',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px',
    padding: '10px 14px',
  };

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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h3 className="dala-heading-sm">{title}</h3>
          <p className="dala-body mt-2" style={{ color: 'var(--dala-ash-gray)' }}>
            {subtitle || viewLabels[viewMode]}
          </p>
        </div>

        {/* Segmented control — Dala style */}
        <div className="flex items-center gap-1 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className="px-4 py-2 rounded-full text-[13px] font-semibold tracking-wider transition-all duration-200 cursor-pointer"
              style={{
                color: viewMode === tab.id ? 'var(--dala-electric-iris)' : 'var(--dala-ash-gray)',
                backgroundColor: viewMode === tab.id ? 'rgba(128, 82, 255, 0.08)' : 'transparent',
                border: viewMode === tab.id ? '1px solid rgba(128, 82, 255, 0.2)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#9a9a9a"
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              style={{ fontSize: '11px', fontWeight: 200 }}
              dy={8}
            />

            {/* Spend Y-axis */}
            {viewMode === 'spend' && (
              <YAxis
                stroke="#9a9a9a"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '11px', fontWeight: 200 }}
                tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
            )}

            {/* Volume Y-axis */}
            {viewMode === 'volume' && (
              <YAxis
                stroke="#9a9a9a"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '11px', fontWeight: 200 }}
                tickFormatter={v => `${v}`}
              />
            )}

            {/* CPL Y-axis */}
            {viewMode === 'cpl' && (
              <YAxis
                stroke="#9a9a9a"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '11px', fontWeight: 200 }}
                tickFormatter={v => `$${v}`}
              />
            )}

            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#9a9a9a', fontWeight: 600, marginBottom: 4, fontSize: 11 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const n = Number(value);
                if (name === 'Ad Spend' || name === 'CPL') {
                  return [`$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                }
                return [n.toLocaleString(), name];
              }}
              cursor={{ stroke: 'rgba(128,82,255,0.2)', strokeWidth: 1 }}
            />

            {viewMode === 'spend' && (
              <Line
                type="monotone"
                dataKey="adSpend"
                stroke="#8052ff"
                name="Ad Spend"
                strokeWidth={2}
                dot={{ fill: '#8052ff', r: 3, strokeWidth: 2, stroke: '#000' }}
                activeDot={{ r: 6, stroke: '#8052ff', strokeWidth: 2, fill: '#000' }}
              />
            )}

            {viewMode === 'volume' && (
              <>
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#ffb829"
                  name="Leads"
                  strokeWidth={2}
                  dot={{ fill: '#ffb829', r: 3, strokeWidth: 2, stroke: '#000' }}
                  activeDot={{ r: 6, stroke: '#ffb829', strokeWidth: 2, fill: '#000' }}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#15846e"
                  name="Conversions"
                  strokeWidth={2}
                  dot={{ fill: '#15846e', r: 3, strokeWidth: 2, stroke: '#000' }}
                  activeDot={{ r: 6, stroke: '#15846e', strokeWidth: 2, fill: '#000' }}
                />
              </>
            )}

            {viewMode === 'cpl' && (
              <Line
                type="monotone"
                dataKey="cpl"
                stroke="#8052ff"
                name="CPL"
                strokeWidth={2}
                dot={{ fill: '#8052ff', r: 3, strokeWidth: 2, stroke: '#000' }}
                activeDot={{ r: 6, stroke: '#8052ff', strokeWidth: 2, fill: '#000' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
