// app/portal/[token]/page.tsx

'use client';

import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icons } from '@/components/common/Icons';
import { ClientDashboardResponse } from '@/types';

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
        setError('Something went wrong loading your dashboard');
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-800 tracking-tight">Preparing Client Dashboard</p>
        <p className="text-xs text-slate-400 mt-1">Aggregating live performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="rounded-2xl bg-white border border-red-200/80 p-8 max-w-md w-full text-center shadow-lg shadow-red-500/5">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-red-200">
            <Icons.X className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-1.5">Portal Unavailable</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Please check your link or contact your agency account manager for an updated access link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return null;
  }

  const summary = data.summary;

  const StatTile = ({
    label,
    value,
    icon: IconComponent,
    color = 'indigo',
    subtitle,
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple';
    subtitle?: string;
  }) => {
    const colorStyles = {
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-slate-300 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorStyles[color]}`}>
            <IconComponent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Brand & Security Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                RP
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-slate-900">ReportPilot</span>
                <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 border-l border-slate-200 pl-2">
                  Client Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Client Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero / Header Section */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
                <Icons.Clients className="w-3.5 h-3.5" />
                Client Performance Report
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.client_name}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time campaign telemetry and ad performance analytics managed by your agency.
              </p>
            </div>

            <div className="self-start lg:self-auto">
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
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Icons.Metrics className="w-4 h-4 text-indigo-600" />
              Executive Metrics
            </h2>
            <span className="text-xs text-slate-400 font-medium">Selected period</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatTile
              label="Active Campaigns"
              value={summary.total_campaigns}
              icon={Icons.Campaigns}
              color="indigo"
            />
            <StatTile
              label="Total Ad Spend"
              value={`$${(summary.total_ad_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={Icons.Spend}
              color="blue"
            />
            <StatTile
              label="Total Leads"
              value={(summary.total_leads || 0).toLocaleString()}
              icon={Icons.Leads}
              color="purple"
            />
            <StatTile
              label="Total Conversions"
              value={(summary.total_conversions || 0).toLocaleString()}
              icon={Icons.Conversions}
              color="emerald"
            />
            <StatTile
              label="Avg Cost / Lead"
              value={`$${(summary.average_cpl || 0).toFixed(2)}`}
              icon={Icons.Metrics}
              color="amber"
              subtitle="Efficiency ratio"
            />
            <StatTile
              label="Conversion Rate"
              value={`${(summary.average_conversion_rate || 0).toFixed(1)}%`}
              icon={Icons.ArrowUpRight}
              color="emerald"
              subtitle="Lead to conversion"
            />
          </div>
        </section>

        {/* Campaigns List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Icons.Campaigns className="w-4 h-4 text-indigo-600" />
              Active Campaigns ({data.campaigns?.length || 0})
            </h2>
          </div>

          {data.campaigns && data.campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {campaign.platform.replace('_', ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          campaign.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : campaign.status === 'paused'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            campaign.status === 'active'
                              ? 'bg-emerald-500'
                              : campaign.status === 'paused'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {campaign.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                    <span>Performance Tracking</span>
                    <span className="text-indigo-600 font-semibold inline-flex items-center gap-0.5">
                      Live telemetry
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              <Icons.Campaigns className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No campaigns found</p>
              <p className="text-xs text-slate-400 mt-0.5">Campaigns will appear here once configured by your agency.</p>
            </div>
          )}
        </section>

        {/* Recent Metrics Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Icons.Metrics className="w-4 h-4 text-indigo-600" />
              Daily Telemetry Log
            </h2>
          </div>

          {data.recent_metrics && data.recent_metrics.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Campaign</th>
                      <th className="px-6 py-3.5 text-right">Ad Spend</th>
                      <th className="px-6 py-3.5 text-right">Leads</th>
                      <th className="px-6 py-3.5 text-right">Conversions</th>
                      <th className="px-6 py-3.5 text-right">Cost / Lead</th>
                      <th className="px-6 py-3.5 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent_metrics.map(metric => (
                      <tr key={metric.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {new Date(metric.reporting_period).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900">
                          {data.campaigns?.find(c => c.id === metric.campaign_id)?.name || 'Unknown Campaign'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-900 text-right font-bold tabular-nums">
                          ${metric.ad_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700 text-right font-medium tabular-nums">
                          {metric.leads.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700 text-right font-medium tabular-nums">
                          {metric.conversions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-900 text-right font-bold tabular-nums">
                          {metric.cost_per_lead ? `$${metric.cost_per_lead.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-900 text-right font-bold tabular-nums">
                          {metric.conversion_rate ? `${metric.conversion_rate.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              <Icons.Metrics className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No telemetry records in this date range</p>
              <p className="text-xs text-slate-400 mt-0.5">Try selecting a broader date range above to view historical data.</p>
            </div>
          )}
        </section>

        {/* Portal Footer Notice */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Icons.Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Private & Verified Client Portal</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Metrics are updated continuously by your agency team. Bookmark this URL for instant access.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Powered by ReportPilot
          </div>
        </div>
      </main>
    </div>
  );
}