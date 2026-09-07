'use client';

import React from 'react';
import {
  IconSpend,
  IconLeads,
  IconConversions,
  IconBarChart3,
} from '@/components/common/Icons';

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBgClass: string;
  trendColorClass?: string;
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  iconBgClass,
  trendColorClass = 'text-emerald-600',
}: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-xl shadow-2xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBgClass}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3 tabular-nums tracking-tight">
        {value}
      </p>
      <p className={`text-xs font-medium mt-1 ${trendColorClass}`}>
        {trend}
      </p>
    </div>
  );
}

export function ProductPreview() {
  const metrics: MetricCardProps[] = [
    {
      title: 'Total Ad Spend',
      value: '$42,850.00',
      trend: '↑ 14.2% vs last period',
      icon: <IconSpend className="w-3.5 h-3.5 text-emerald-600" />,
      iconBgClass: 'bg-emerald-50 text-emerald-600',
      trendColorClass: 'text-emerald-600',
    },
    {
      title: 'Qualified Leads',
      value: '1,420',
      trend: '↑ 8.6% efficiency',
      icon: <IconLeads className="w-3.5 h-3.5 text-sky-600" />,
      iconBgClass: 'bg-sky-50 text-sky-600',
      trendColorClass: 'text-emerald-600',
    },
    {
      title: 'Average CPL',
      value: '$30.18',
      trend: '↓ $4.20 cost reduction',
      icon: <IconBarChart3 className="w-3.5 h-3.5 text-emerald-600" />,
      iconBgClass: 'bg-emerald-50 text-emerald-600',
      trendColorClass: 'text-emerald-600',
    },
    {
      title: 'Conversions',
      value: '284',
      trend: '20.0% conversion rate',
      icon: <IconConversions className="w-3.5 h-3.5 text-amber-600" />,
      iconBgClass: 'bg-amber-50 text-amber-600',
      trendColorClass: 'text-emerald-600',
    },
  ];

  return (
    <section id="preview" className="pt-6 pb-12 sm:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Product Preview Outer Frame */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-xl shadow-slate-200/40">
        {/* Preview Browser / Window Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 px-2">
          <div className="flex items-center gap-3">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            </div>

            {/* URL bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-md px-3 py-1 flex items-center gap-2">
              <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs text-slate-500 font-mono">app.reportpilot.com/dashboard</span>
            </div>
          </div>

          {/* Live Sync Badge */}
          <div className="flex items-center self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        {/* Dashboard Preview Body */}
        <div className="p-2 sm:p-4 pt-5">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
