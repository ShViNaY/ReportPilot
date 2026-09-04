// components/charts/TrendChart.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MetricEntry } from '@/types';

interface TrendChartProps {
  metrics: MetricEntry[];
  title: string;
}

export function TrendChart({ metrics, title }: TrendChartProps) {
  // Sort by date
  const sorted = [...metrics].sort(
    (a, b) =>
      new Date(a.reporting_period).getTime() -
      new Date(b.reporting_period).getTime()
  );

  // Format data for chart
  const data = sorted.map(m => ({
    date: new Date(m.reporting_period).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    adSpend: m.ad_spend,
    leads: m.leads,
    conversions: m.conversions,
    cpl: m.cost_per_lead || 0,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400 text-sm">
        No performance data available for this range
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Continuous trajectory over reporting dates</p>
        </div>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              style={{ fontSize: '11px', fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(51, 65, 85, 0.8)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                color: '#fff',
                fontSize: '12px',
                padding: '10px 14px',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}
              formatter={(value: any, name: any) => {
                if (typeof value === 'number') {
                  return [value.toLocaleString(), name];
                }
                return [value, name];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            <Line
              type="monotone"
              dataKey="adSpend"
              stroke="#6366f1"
              name="Ad Spend ($)"
              strokeWidth={2.5}
              dot={{ fill: '#6366f1', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 3, fill: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#10b981"
              name="Leads"
              strokeWidth={2.5}
              dot={{ fill: '#10b981', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 3, fill: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              stroke="#f59e0b"
              name="Conversions"
              strokeWidth={2.5}
              dot={{ fill: '#f59e0b', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 3, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}