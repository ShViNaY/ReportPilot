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
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
        No data available to display chart
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="adSpend"
            stroke="#6366f1"
            name="Ad Spend ($)"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="leads"
            stroke="#10b981"
            name="Leads"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="conversions"
            stroke="#f59e0b"
            name="Conversions"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}