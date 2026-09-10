// app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { TrendChart } from '@/components/charts/TrendChart';
import { KPISummary } from '@/components/charts/KPISummary';
import { cachedApiFetch, getCachedData, formatDateParam } from '@/lib/utils/apiCache';
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

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  href,
  ariaLabel,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  ariaLabel?: string;
}) => (
  <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-semibold text-zinc-100 mt-2 tracking-tight tabular-nums">{value}</p>
        {subtext && (
          <p className="text-xs text-zinc-500 mt-1 font-medium">{subtext}</p>
        )}
      </div>
      {href ? (
        <Link
          href={href}
          aria-label={ariaLabel}
          title={ariaLabel}
          className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/60 flex items-center justify-center text-zinc-400 shrink-0 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-lime-400/50"
        >
          <Icon className="w-4 h-4" />
        </Link>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/60 flex items-center justify-center text-zinc-400 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
  </div>
);

export default function DashboardPage() {
  // Date range state - initialized synchronously
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const summaryUrl = useMemo(
    () => `/api/dashboard/agency?startDate=${formatDateParam(startDate)}&endDate=${formatDateParam(endDate)}`,
    [startDate, endDate]
  );
  const metricsUrl = useMemo(
    () => `/api/metrics?startDate=${formatDateParam(startDate)}&endDate=${formatDateParam(endDate)}`,
    [startDate, endDate]
  );

  // Initialize state with cache if available
  const initialSummary = useMemo(() => {
    const cached = getCachedData<{ success: boolean; summary: AgencyDashboardSummary }>(summaryUrl);
    return cached?.success ? cached.summary : null;
  }, [summaryUrl]);

  const initialMetrics = useMemo(() => {
    const cached = getCachedData<{ success: boolean; metrics: MetricEntry[] }>(metricsUrl);
    return cached?.success ? cached.metrics : [];
  }, [metricsUrl]);

  const [summary, setSummary] = useState<AgencyDashboardSummary | null>(initialSummary);
  const [metrics, setMetrics] = useState<MetricEntry[]>(initialMetrics);
  const [isLoading, setIsLoading] = useState<boolean>(!initialSummary);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async (hasCachedData = false) => {
    try {
      if (!hasCachedData) {
        setIsLoading(true);
      }

      const [summaryData, metricsData] = await Promise.all([
        cachedApiFetch<{ success: boolean; summary?: AgencyDashboardSummary; error?: string }>(summaryUrl),
        cachedApiFetch<{ success: boolean; metrics?: MetricEntry[]; error?: string }>(metricsUrl),
      ]);

      if (!summaryData.success) {
        setError(summaryData.error || 'Failed to load dashboard');
        return;
      }

      setError('');
      if (summaryData.summary) {
        setSummary(summaryData.summary);
      }

      if (metricsData.success) {
        setMetrics(metricsData.metrics || []);
      }
    } catch (err) {
      setError('Something went wrong');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [summaryUrl, metricsUrl]);

  // Fetch data when dates change or on mount
  useEffect(() => {
    fetchDashboard(!!summary);
  }, [fetchDashboard]);



  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-lime-400 animate-spin mx-auto" />
          <p className="text-sm font-medium text-zinc-500">Loading agency dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="rounded-2xl bg-rose-950/40 border border-rose-800/60 p-5">
        <p className="text-sm text-rose-300 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Agency Overview</h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Aggregated cross-client performance and reporting intelligence.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/clients"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold transition-all active:scale-98 cursor-pointer shadow-xs"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Client</span>
              </Link>
              <Link
                href="/metrics"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-transparent border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs font-medium transition-all active:scale-98 cursor-pointer"
              >
                <IconMetrics className="w-3.5 h-3.5 text-zinc-400" />
                <span>Enter Metrics</span>
              </Link>
            </div>
          </div>

          {/* Date Range Filter Bar */}
          <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-3.5 sm:p-4">
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
              href="/clients"
              ariaLabel="View clients"
            />
            <StatCard
              label="Active Campaigns"
              value={summary?.total_campaigns ?? 0}
              icon={IconCampaigns}
              href="/campaigns"
              ariaLabel="View campaigns"
            />
            <StatCard
              label="Total Ad Spend"
              value={`$${(summary?.total_ad_spend ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={IconSpend}
            />
            <StatCard
              label="Total Leads"
              value={(summary?.total_leads ?? 0).toLocaleString()}
              icon={IconLeads}
            />
            <StatCard
              label="Total Conversions"
              value={(summary?.total_conversions ?? 0).toLocaleString()}
              icon={IconConversions}
            />
            <StatCard
              label="Average CPL"
              value={`$${(summary?.average_cpl ?? 0).toFixed(2)}`}
              subtext="Cost per qualified lead"
              icon={IconMetrics}
            />
          </div>

          {/* Key Performance Benchmarks Card */}
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Conversion & Performance Health
              </h2>
              <span className="text-[11px] font-medium text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 rounded-full">
                Active Benchmark
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3 p-5 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Average Conversion Rate</span>
                  <span className="text-2xl font-bold text-zinc-100 tabular-nums">
                    {(summary?.average_conversion_rate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-lime-400 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(summary?.average_conversion_rate ?? 0, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Calculated across all active client campaign records in selected timeframe.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-xl bg-zinc-950/60 border border-zinc-800/70 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-400">Portfolio Return Index</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-semibold text-lime-400">Optimal</span>
                    <span className="text-xs text-zinc-400 font-medium">Healthy ROI trajectory</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 pt-3 border-t border-zinc-800/60">
                  Campaign metrics are performing efficiently. Keep monitoring individual client velocity below.
                </p>
              </div>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
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
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <IconMetrics className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-300">No metric entries for this period</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Enter your monthly numbers in the Metrics tab to visualize trends.
                </p>
              </div>
              <Link
                href="/metrics"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black rounded-full text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Enter Metrics</span>
                <IconArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
    </div>
  );
}