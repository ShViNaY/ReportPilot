// app/(dashboard)/dashboard/page.tsx

'use client';

import { TrendChart } from '@/components/charts/TrendChart';
import { KPISummary } from '@/components/charts/KPISummary';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { apiFetch } from '@/lib/utils/apiClient';
import { AgencyDashboardSummary, MetricEntry } from '@/types';

export default function DashboardPage() {
    const [summary, setSummary] = useState<AgencyDashboardSummary | null>(null);
    const [metrics, setMetrics] = useState<MetricEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
        try {
            // Fetch dashboard summary
            const res = await apiFetch('/api/dashboard/agency');
            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Failed to load dashboard');
                return;
            }

            setSummary(data.summary);

            // Fetch metrics for charts
            const metricsRes = await apiFetch('/api/metrics');
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

    fetchDashboard();
    }, []);

  const StatCard = ({
    label,
    value,
    subtext,
    icon,
  }: {
    label: string;
    value: string | number;
    subtext?: string;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-indigo-600 animate-spin mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <p className="text-slate-600 mt-4">Loading dashboard...</p>
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
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Welcome back! Here's your agency performance.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Total Clients"
              value={summary?.total_clients ?? 0}
              icon="👥"
            />
            <StatCard
              label="Total Campaigns"
              value={summary?.total_campaigns ?? 0}
              icon="📢"
            />
            <StatCard
              label="Total Ad Spend"
              value={`$${(summary?.total_ad_spend ?? 0).toLocaleString()}`}
              icon="💰"
            />
            <StatCard
              label="Total Leads"
              value={summary?.total_leads ?? 0}
              icon="🎯"
            />
            <StatCard
              label="Total Conversions"
              value={summary?.total_conversions ?? 0}
              icon="✅"
            />
            <StatCard
              label="Average CPL"
              value={`$${(summary?.average_cpl ?? 0).toFixed(2)}`}
              subtext="Cost per lead"
              icon="📊"
            />
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Key Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Average Conversion Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-indigo-600">
                    {(summary?.average_conversion_rate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(summary?.average_conversion_rate ?? 0, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">ROI Status</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">Good</span>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  Your campaigns are performing well. Keep monitoring trends!
                </p>
              </div>
            </div>
          </div>

                    
          {/* KPI Charts */}
            <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Performance Indicators</h2>
            <KPISummary metrics={metrics} />
            </div>

            {/* Trend Chart */}
            {metrics.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Trends</h2>
                <TrendChart metrics={metrics} title="Ad Spend, Leads & Conversions Over Time" />
            </div>
            )}

          {/* Quick Actions */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              
                <a href="/clients"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Add Client
              </a>
              
                <a href="/campaigns"
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
              >
                Create Campaign
              </a>
              
                <a href="/metrics"
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
              >
                Enter Metrics
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}