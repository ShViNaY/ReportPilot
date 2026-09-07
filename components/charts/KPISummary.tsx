// components/charts/KPISummary.tsx
'use client';

import { MetricEntry } from '@/types';
import { IconSpend, IconConversions, IconMetrics } from '@/components/common/Icons';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Average CPL Card */}
      <div className="bg-[#111113] rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Average CPL</p>
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/60 text-zinc-400 flex items-center justify-center">
            <IconSpend className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-xs text-zinc-500 font-medium">$</span>
          <span className="text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">
            {avgCPL.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="inline-flex items-center text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
            Cost per acquisition
          </span>
        </div>
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-[#111113] rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg Conversion Rate</p>
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/60 text-zinc-400 flex items-center justify-center">
            <IconConversions className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">
            {avgConvRate.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-zinc-500">%</span>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="inline-flex items-center text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
            Leads → Conversions
          </span>
        </div>
      </div>

      {/* Est. Campaign Efficiency / ROI Card */}
      <div className="bg-[#111113] rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Est. Return Index</p>
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/60 text-zinc-400 flex items-center justify-center">
            <IconMetrics className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">
            {roi.toFixed(0)}
          </span>
          <span className="text-sm font-semibold text-zinc-500">%</span>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="inline-flex items-center text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
            Performance ratio
          </span>
        </div>
      </div>
    </div>
  );
}