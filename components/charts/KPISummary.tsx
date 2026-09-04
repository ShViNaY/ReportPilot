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
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average CPL</p>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IconSpend className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-xs text-slate-400 font-medium">$</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {avgCPL.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
            Cost per acquisition
          </span>
        </div>
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Conversion Rate</p>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IconConversions className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {avgConvRate.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-slate-500">%</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Leads → Conversions
          </span>
        </div>
      </div>

      {/* Est. Campaign Efficiency / ROI Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Return Index</p>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <IconMetrics className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {roi.toFixed(0)}
          </span>
          <span className="text-sm font-semibold text-slate-500">%</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            Performance ratio
          </span>
        </div>
      </div>
    </div>
  );
}