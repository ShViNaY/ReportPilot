// components/charts/KPISummary.tsx

'use client';

import { MetricEntry } from '@/types';

interface KPISummaryProps {
  metrics: MetricEntry[];
}

export function KPISummary({ metrics }: KPISummaryProps) {
  // Calculate aggregates
  const totalSpend = metrics.reduce((sum, m) => sum + m.ad_spend, 0);
  const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

  const cplValues = metrics.filter(m => m.cost_per_lead).map(m => m.cost_per_lead || 0);
  const avgCPL = cplValues.length > 0 ? cplValues.reduce((a, b) => a + b, 0) / cplValues.length : 0;

  const convRateValues = metrics.filter(m => m.conversion_rate).map(m => m.conversion_rate || 0);
  const avgConvRate = convRateValues.length > 0 ? convRateValues.reduce((a, b) => a + b, 0) / convRateValues.length : 0;

  const roi = totalSpend > 0 ? ((totalConversions * 50) / totalSpend) * 100 : 0; // Assuming $50 per conversion

  const KPICard = ({
    label,
    value,
    unit,
    trend,
    color,
  }: {
    label: string;
    value: number;
    unit: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
  }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-4 border border-${color}-200`}>
      <p className={`text-sm text-${color}-700 font-medium`}>{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className={`text-2xl font-bold text-${color}-900`}>
          {value.toLocaleString('en-US', {
            maximumFractionDigits: value < 100 ? 2 : 0,
          })}
        </p>
        <p className={`text-sm text-${color}-600`}>{unit}</p>
      </div>
      {trend && (
        <p className={`text-xs mt-2 ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trend !== 'neutral' ? 'vs last period' : 'stable'}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        label="Average CPL"
        value={avgCPL}
        unit="$"
        color="indigo"
      />
      <KPICard
        label="Conversion Rate"
        value={avgConvRate}
        unit="%"
        color="green"
      />
      <KPICard
        label="ROI"
        value={roi}
        unit="%"
        color="blue"
      />
    </div>
  );
}