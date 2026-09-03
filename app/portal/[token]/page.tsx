// app/portal/[token]/page.tsx

'use client';

import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/utils/apiClient';
import { ClientDashboardResponse, ClientDashboardSummary, Campaign, MetricEntry } from '@/types';

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<ClientDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart);
    setEndDate(today);
  }, []);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setIsLoading(true);
        let url = `/api/dashboard/client?token=${token}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        }
        const res = await fetch(url);
        const result = await res.json();

        if (!result.success) {
          setError(result.error || 'Unable to access this client portal');
          return;
        }
        setData(result);
      } catch (err) {
        setError('Something went wrong');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && startDate && endDate) {
      fetchPortalData();
    }
  }, [token, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-indigo-600 animate-spin mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-slate-600 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="rounded-lg bg-red-50 border border-red-200 p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-4">
            Please check the link or contact your agency for a new portal link.
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return null;
  }

  const summary = data.summary;

  const StatCard = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | number;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">
              {summary.client_name}
            </h1>
            <p className="text-slate-500">
              Campaign performance dashboard
            </p>
          </div>
          <div className="mt-4">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Performance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Total Campaigns"
              value={summary.total_campaigns}
              icon="📢"
            />
            <StatCard
              label="Total Ad Spend"
              value={`$${(summary.total_ad_spend || 0).toLocaleString()}`}
              icon="💰"
            />
            <StatCard
              label="Total Leads"
              value={summary.total_leads}
              icon="🎯"
            />
            <StatCard
              label="Total Conversions"
              value={summary.total_conversions}
              icon="✅"
            />
            <StatCard
              label="Average CPL"
              value={`$${(summary.average_cpl || 0).toFixed(2)}`}
              icon="📊"
            />
            <StatCard
              label="Conversion Rate"
              value={`${(summary.average_conversion_rate || 0).toFixed(1)}%`}
              icon="📈"
            />
          </div>
        </div>

        {/* Campaigns */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Your Campaigns
          </h2>
          {data.campaigns && data.campaigns.length > 0 ? (
            <div className="space-y-4">
              {data.campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg border border-slate-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {campaign.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                        <span>Platform: <strong>{campaign.platform.replace('_', ' ')}</strong></span>
                        <span>
                          Status:{' '}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              campaign.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : campaign.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-600">
              No campaigns yet
            </div>
          )}
        </div>

        {/* Recent Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Performance Data
          </h2>
          {data.recent_metrics && data.recent_metrics.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
                      Ad Spend
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
                      Leads
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
                      Conversions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
                      CPL
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
                      Conv. Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.recent_metrics.map(metric => (
                    <tr key={metric.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {new Date(metric.reporting_period).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {data.campaigns?.find(c => c.id === metric.campaign_id)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">
                        ${metric.ad_spend.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right">
                        {metric.leads.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">
                        {metric.conversions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right font-semibold">
                        {metric.cost_per_lead ? `$${metric.cost_per_lead.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 text-right font-semibold">
                        {metric.conversion_rate ? `${metric.conversion_rate.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-600">
              No metrics data available yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-700 text-sm">
            📊 This is your secure client portal. Data is updated regularly by your agency team.
          </p>
        </div>
      </div>
    </div>
  );
}