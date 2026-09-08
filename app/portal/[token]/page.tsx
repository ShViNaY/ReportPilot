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
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center px-4">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-lime-400 animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-200 tracking-tight">Preparing Client Dashboard</p>
        <p className="text-xs text-zinc-500 mt-1">Aggregating live performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="rounded-2xl bg-[#111113] border border-rose-900/60 p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-800/60">
            <Icons.X className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 mb-1.5">Portal Unavailable</h1>
          <p className="text-sm text-zinc-400">{error}</p>
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
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
    subtitle,
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
  }) => {
    return (
      <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/60 flex items-center justify-center text-zinc-400 shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-zinc-100 tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-lime-400 selection:text-black">
      {/* Brand & Security Top Bar */}
      <div className="bg-[#111113]/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-lime-400 text-black flex items-center justify-center font-bold text-xs shadow-xs">
                RP
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-zinc-100">Report<span className="text-lime-400">Pilot</span></span>
                <span className="hidden sm:inline-block text-xs text-zinc-500 ml-2.5 border-l border-zinc-800 pl-2.5">
                  Client Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                Live Client Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero / Header Section */}
      <div className="bg-transparent border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 rounded-full mb-2.5">
                <Icons.Clients className="w-3.5 h-3.5 text-lime-400" />
                <span>Client Performance Report</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                {summary.client_name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Real-time campaign telemetry and ad performance analytics managed by your agency.
              </p>
            </div>

            <div className="self-start lg:self-auto bg-[#111113] p-2 sm:p-2.5 rounded-2xl border border-zinc-800/80">
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
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              <Icons.Metrics className="w-4 h-4 text-lime-400" />
              Executive Metrics
            </h2>
            <span className="text-xs text-zinc-500 font-medium">Selected period</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatTile
              label="Active Campaigns"
              value={summary.total_campaigns}
              icon={Icons.Campaigns}
            />
            <StatTile
              label="Total Ad Spend"
              value={`$${(summary.total_ad_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={Icons.Spend}
            />
            <StatTile
              label="Total Leads"
              value={(summary.total_leads || 0).toLocaleString()}
              icon={Icons.Leads}
            />
            <StatTile
              label="Total Conversions"
              value={(summary.total_conversions || 0).toLocaleString()}
              icon={Icons.Conversions}
            />
            <StatTile
              label="Avg Cost / Lead"
              value={`$${(summary.average_cpl || 0).toFixed(2)}`}
              icon={Icons.Metrics}
              subtitle="Efficiency ratio"
            />
            <StatTile
              label="Conversion Rate"
              value={`${(summary.average_conversion_rate || 0).toFixed(1)}%`}
              icon={Icons.ArrowUpRight}
              subtitle="Lead to conversion"
            />
          </div>
        </section>

        {/* Campaigns List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              <Icons.Campaigns className="w-4 h-4 text-lime-400" />
              Active Campaigns ({data.campaigns?.length || 0})
            </h2>
          </div>

          {data.campaigns && data.campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-lg">
                        {campaign.platform.replace('_', ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          campaign.status === 'active'
                            ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                            : campaign.status === 'paused'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/80'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            campaign.status === 'active'
                              ? 'bg-lime-400'
                              : campaign.status === 'paused'
                              ? 'bg-amber-400'
                              : 'bg-zinc-500'
                          }`}
                        />
                        <span className="capitalize">{campaign.status}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-100 truncate">
                      {campaign.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-between">
                    <span>Performance Tracking</span>
                    <span className="text-lime-400 font-medium inline-flex items-center gap-1">
                      Live telemetry
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-8 text-center text-zinc-500">
              <Icons.Campaigns className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No campaigns found</p>
              <p className="text-xs text-zinc-500 mt-0.5">Campaigns will appear here once configured by your agency.</p>
            </div>
          )}
        </section>

        {/* Recent Metrics Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              <Icons.Metrics className="w-4 h-4 text-lime-400" />
              Daily Telemetry Log
            </h2>
          </div>

          {data.recent_metrics && data.recent_metrics.length > 0 ? (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.recent_metrics.map(metric => (
                      <tr key={metric.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-zinc-400">
                          {new Date(metric.reporting_period).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-200">
                          {data.campaigns?.find(c => c.id === metric.campaign_id)?.name || 'Unknown Campaign'}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-100 text-right font-bold tabular-nums">
                          ${metric.ad_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-300 text-right font-medium tabular-nums">
                          {metric.leads.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-300 text-right font-medium tabular-nums">
                          {metric.conversions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-100 text-right font-bold tabular-nums">
                          {metric.cost_per_lead ? `$${metric.cost_per_lead.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-100 text-right font-bold tabular-nums">
                          {metric.conversion_rate ? `${metric.conversion_rate.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-8 text-center text-zinc-500">
              <Icons.Metrics className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No telemetry records in this date range</p>
              <p className="text-xs text-zinc-500 mt-0.5">Try selecting a broader date range above to view historical data.</p>
            </div>
          )}
        </section>

        {/* Portal Footer Notice */}
        <div className="rounded-2xl bg-[#111113] border border-zinc-800/80 text-zinc-100 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <Icons.Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Private & Verified Client Portal</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Metrics are updated continuously by your agency team. Bookmark this URL for instant access.
              </p>
            </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            Powered by ReportPilot
          </div>
        </div>
      </main>
    </div>
  );
}