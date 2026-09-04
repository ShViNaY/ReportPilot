// app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { TrendChart } from '@/components/charts/TrendChart';
import { KPISummary } from '@/components/charts/KPISummary';
import { apiFetch } from '@/lib/utils/apiClient';
import { AgencyDashboardSummary, MetricEntry } from '@/types';
import {
  IconClients,
  IconCampaigns,
  IconSpend,
  IconLeads,
  IconConversions,
  IconMetrics,
  IconArrowUpRight,
  IconPlus,
} from '@/components/common/Icons';

export default function DashboardPage() {
  const [summary, setSummary] = useState<AgencyDashboardSummary | null>(null);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Initialize and fetch data
  useEffect(() => {
    // Initialize with "This Month"
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart);
    setEndDate(today);
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboard();
    }
  }, [startDate, endDate]);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard summary (filtered by the same selected date range)
      const summaryUrl = `/api/dashboard/agency?startDate=${startDate?.toISOString()}&endDate=${endDate?.toISOString()}`;
      const res = await apiFetch(summaryUrl);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to load dashboard');
        return;
      }

      setSummary(data.summary);

      // Fetch metrics for charts with date filtering
      const metricsUrl = `/api/metrics?startDate=${startDate?.toISOString()}&endDate=${endDate?.toISOString()}`;
      const metricsRes = await apiFetch(metricsUrl);
      const metricsData = await metricsRes.json();

      if (metricsData.success) {
        setMetrics(metricsData.metrics || []);
      }
    } catch (err) {
      setError('Something went wrong');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({
    label,
    value,
    subtext,
    icon: Icon,
    iconColor = 'text-indigo-600 bg-indigo-50',
  }: {
    label: string;
    value: string | number;
    subtext?: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
  }) => (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight tabular-nums">{value}</p>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <svg
                className="w-10 h-10 text-indigo-600 animate-spin mx-auto"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <p className="text-sm font-medium text-slate-500">Loading agency dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4">
            <p className="text-sm text-rose-700 font-medium">{error}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Agency Overview</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Aggregated cross-client performance and reporting intelligence.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href="/clients"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span>Add Client</span>
              </Link>
              <Link
                href="/metrics"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <IconMetrics className="w-3.5 h-3.5 text-slate-500" />
                <span>Enter Metrics</span>
              </Link>
            </div>
          </div>

          {/* Date Range Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={(range, start, end) => {
                setDateRange(range);
                if (start && end) {
                  setStartDate(start);
                  setEndDate(end);
                }
              }}
            />
          </div>

          {/* Summary Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Active Clients"
              value={summary?.total_clients ?? 0}
              icon={IconClients}
              iconColor="text-indigo-600 bg-indigo-50"
            />
            <StatCard
              label="Active Campaigns"
              value={summary?.total_campaigns ?? 0}
              icon={IconCampaigns}
              iconColor="text-purple-600 bg-purple-50"
            />
            <StatCard
              label="Total Ad Spend"
              value={`$${(summary?.total_ad_spend ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={IconSpend}
              iconColor="text-emerald-600 bg-emerald-50"
            />
            <StatCard
              label="Total Leads"
              value={(summary?.total_leads ?? 0).toLocaleString()}
              icon={IconLeads}
              iconColor="text-blue-600 bg-blue-50"
            />
            <StatCard
              label="Total Conversions"
              value={(summary?.total_conversions ?? 0).toLocaleString()}
              icon={IconConversions}
              iconColor="text-amber-600 bg-amber-50"
            />
            <StatCard
              label="Average CPL"
              value={`$${(summary?.average_cpl ?? 0).toFixed(2)}`}
              subtext="Cost per qualified lead"
              icon={IconMetrics}
              iconColor="text-teal-600 bg-teal-50"
            />
          </div>

          {/* Key Performance Benchmarks Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Conversion & Performance Health
              </h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                Active Benchmark
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Average Conversion Rate</span>
                  <span className="text-2xl font-bold text-indigo-600 tabular-nums">
                    {(summary?.average_conversion_rate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(summary?.average_conversion_rate ?? 0, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculated across all active client campaign records in selected timeframe.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Portfolio Return Index</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-emerald-600">Optimal</span>
                    <span className="text-xs text-emerald-700 font-medium">Healthy ROI trajectory</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  Campaign metrics are performing efficiently. Keep monitoring individual client velocity below.
                </p>
              </div>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Key Performance Indicators
              </h2>
            </div>
            <KPISummary metrics={metrics} />
          </div>

          {/* Trend Chart */}
          {metrics.length > 0 && (
            <div>
              <TrendChart 
                metrics={metrics} 
                title="Cross-Client Performance Trends" 
              />
            </div>
          )}

          {/* Empty Data State */}
          {metrics.length === 0 && (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <IconMetrics className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">No metric entries for this period</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your monthly numbers in the Metrics tab to visualize trends.
                </p>
              </div>
              <Link
                href="/metrics"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Enter Metrics</span>
                <IconArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}