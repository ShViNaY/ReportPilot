// app/(dashboard)/metrics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { TrendChart } from '@/components/charts/TrendChart';
import { CampaignChart } from '@/components/charts/CampaignChart';
import { apiFetch } from '@/lib/utils/apiClient';
import { MetricEntry, Campaign, Client } from '@/types';
import {
  IconMetrics,
  IconDownload,
  IconEdit,
  IconTrash,
  IconPlus,
  IconX,
  IconSpend,
  IconLeads,
  IconConversions,
} from '@/components/common/Icons';

export default function MetricsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const filterCampaignId = searchParams.get('campaign_id');

  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(filterCampaignId || '');
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Sync URL filterCampaignId if changed
  useEffect(() => {
    if (filterCampaignId) {
      setSelectedCampaignId(filterCampaignId);
    }
  }, [filterCampaignId]);

  // Form state
  const [formData, setFormData] = useState({
    campaign_id: filterCampaignId || '',
    reporting_period: '',
    ad_spend: '',
    impressions: '',
    clicks: '',
    leads: '',
    conversions: '',
  });
  const [formError, setFormError] = useState('');

  // Fetch data on mount
  useEffect(() => {
    const today = new Date();
    const monthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    setStartDate(monthStart);
    setEndDate(today);

    fetchData(monthStart, today);
  }, []);

  const fetchData = async (start?: Date, end?: Date) => {
    try {
      setIsLoading(true);

      // Fetch metrics
      let metricsUrl = '/api/metrics';

      if (start && end) {
        metricsUrl += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }
      const metricsRes = await apiFetch(metricsUrl);
      const metricsData = await metricsRes.json();

      if (!metricsData.success) {
        setError(metricsData.error || 'Failed to load metrics');
        return;
      }

      setMetrics(metricsData.metrics || []);

      // Fetch campaigns
      const campaignsRes = await apiFetch('/api/campaigns');
      const campaignsData = await campaignsRes.json();

      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || []);
      }

      // Fetch clients
      const clientsRes = await apiFetch('/api/clients');
      const clientsData = await clientsRes.json();

      if (clientsData.success) {
        setClients(clientsData.clients || []);
      }
    } catch (err) {
      setError('Something went wrong');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.campaign_id) {
      setFormError('Please select a campaign');
      return;
    }

    if (!formData.reporting_period) {
      setFormError('Reporting period is required');
      return;
    }

    // Validate numbers
    const adSpend = parseFloat(formData.ad_spend || '0');
    const impressions = parseInt(formData.impressions || '0');
    const clicks = parseInt(formData.clicks || '0');
    const leads = parseInt(formData.leads || '0');
    const conversions = parseInt(formData.conversions || '0');

    if (adSpend < 0 || impressions < 0 || clicks < 0 || leads < 0 || conversions < 0) {
      setFormError('Metrics cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingId) {
        // Update existing metric
        const res = await apiFetch(`/api/metrics/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ad_spend: adSpend,
            impressions,
            clicks,
            leads,
            conversions,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setFormError(data.error || 'Failed to update metric');
          return;
        }

        // Update local state
        setMetrics(
          metrics.map(m => (m.id === editingId ? data.metric : m))
        );
        setEditingId(null);
      } else {
        // Create new metric
        const res = await apiFetch('/api/metrics', {
          method: 'POST',
          body: JSON.stringify({
            campaign_id: formData.campaign_id,
            reporting_period: formData.reporting_period,
            ad_spend: adSpend,
            impressions,
            clicks,
            leads,
            conversions,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setFormError(data.error || 'Failed to create metric');
          return;
        }

        setMetrics([data.entry, ...metrics]);
      }

      // Reset form
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError('Something went wrong');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (metric: MetricEntry) => {
    setEditingId(metric.id);
    setFormData({
      campaign_id: metric.campaign_id,
      reporting_period: metric.reporting_period,
      ad_spend: metric.ad_spend.toString(),
      impressions: metric.impressions.toString(),
      clicks: metric.clicks.toString(),
      leads: metric.leads.toString(),
      conversions: metric.conversions.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this metric entry?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/metrics/${metricId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to delete metric');
        return;
      }

      setMetrics(metrics.filter(m => m.id !== metricId));
    } catch (err) {
      setError('Failed to delete metric');
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      campaign_id: filterCampaignId || '',
      reporting_period: '',
      ad_spend: '',
      impressions: '',
      clicks: '',
      leads: '',
      conversions: '',
    });
    setFormError('');
  };

  const getCampaignName = (campaignId: string) => {
    return campaigns.find(c => c.id === campaignId)?.name || 'Unknown Campaign';
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const exportToCSV = () => {
    if (!selectedClientId) return;

    const clientMetrics = metrics
      .filter(m => m.client_id === selectedClientId)
      .sort((a, b) => new Date(a.reporting_period).getTime() - new Date(b.reporting_period).getTime());

    if (clientMetrics.length === 0) {
      alert('No metrics found for this client in the selected date range.');
      return;
    }

    const headers = [
      'Date', 'Campaign', 'Ad Spend', 'Impressions', 'Clicks',
      'Leads', 'Conversions', 'CPL', 'Conversion Rate',
    ];

    const rows = clientMetrics.map(m => [
      m.reporting_period,
      getCampaignName(m.campaign_id).replace(/,/g, ''),
      m.ad_spend,
      m.impressions,
      m.clicks,
      m.leads,
      m.conversions,
      m.cost_per_lead ?? '',
      m.conversion_rate ?? '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    const clientName = clients.find(c => c.id === selectedClientId)?.name || 'client';
    const rangeStart = startDate?.toISOString().split('T')[0] || 'start';
    const rangeEnd = endDate?.toISOString().split('T')[0] || 'end';
    const fileName = `${clientName.replace(/\s+/g, '_')}_metrics_${rangeStart}_to_${rangeEnd}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Step 1: Filter by selected client (if any)
  const clientFilteredMetrics = selectedClientId
    ? metrics.filter(m => m.client_id === selectedClientId)
    : metrics;

  // Step 2: Filter by selected campaign (clicked in table or selector)
  const campaignFilteredMetrics = selectedCampaignId
    ? clientFilteredMetrics.filter(m => m.campaign_id === selectedCampaignId)
    : clientFilteredMetrics;

  // Unique reporting periods available in the current view, newest first
  const availablePeriods = [...new Set(campaignFilteredMetrics.map(m => m.reporting_period))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatPeriod = (period: string) =>
    new Date(period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Further filter by the selected month, if one is chosen
  const periodFilteredMetrics =
    selectedPeriod === 'all'
      ? campaignFilteredMetrics
      : campaignFilteredMetrics.filter(m => m.reporting_period === selectedPeriod);

  // Sort by reporting period (newest first)
  const sortedMetrics = [...periodFilteredMetrics].sort(
    (a, b) => new Date(b.reporting_period).getTime() - new Date(a.reporting_period).getTime()
  );

  // Selected campaign object for info display
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Filter campaigns list for campaign dropdown
  const availableCampaigns = selectedClientId
    ? campaigns.filter(c => c.client_id === selectedClientId)
    : campaigns;

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
              <p className="text-sm font-medium text-slate-500">Loading campaign metrics...</p>
            </div>
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Campaign Metrics</h1>
                {filterCampaignId && (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                    {getCampaignName(filterCampaignId)}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {filterCampaignId
                  ? `Performance records for ${getCampaignName(filterCampaignId)}`
                  : 'Track and analyze cross-platform marketing performance records'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {availablePeriods.length > 1 && (
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-2xs cursor-pointer"
                >
                  <option value="all">All reporting periods</option>
                  {availablePeriods.map((period) => (
                    <option key={period} value={period}>
                      {formatPeriod(period)}
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={() => {
                  if (showForm) {
                    resetForm();
                  }
                  setShowForm(!showForm);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white self-start sm:self-auto"
              >
                {showForm ? 'Cancel' : '+ Enter Metrics'}
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Client Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Client:</span>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedCampaignId('');
                    setSelectedPeriod('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-2xs"
                >
                  {clients.length > 1 && <option value="">All client accounts</option>}
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Campaign:</span>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => {
                    setSelectedCampaignId(e.target.value);
                    setSelectedPeriod('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-2xs"
                >
                  <option value="">All active campaigns</option>
                  {availableCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
                {selectedCampaignId && (
                  <button
                    onClick={() => setSelectedCampaignId('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Clear campaign filter"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* CSV Export */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={!selectedClientId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <IconDownload className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              {!selectedClientId && (
                <span className="text-[11px] text-slate-400 italic">Select client to export</span>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={(range, start, end) => {
                setDateRange(range);
                if (start && end) {
                  setStartDate(start);
                  setEndDate(end);
                  fetchData(start, end);
                }
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4">
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* Metric Entry Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">
                  {editingId ? 'Edit Metric Record' : 'Log New Campaign Metrics'}
                </h2>
                <span className="text-xs text-slate-400">Periodic reporting data</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campaign Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                      Target Campaign
                    </label>
                    <select
                      value={formData.campaign_id}
                      onChange={(e) =>
                        setFormData({ ...formData, campaign_id: e.target.value })
                      }
                      disabled={editingId !== null}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 disabled:bg-slate-50 shadow-2xs"
                      required
                    >
                      <option value="">Select a campaign...</option>
                      {campaigns
                        .filter(c => !selectedClientId || c.client_id === selectedClientId)
                        .map(campaign => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                    </select>
                    {selectedClientId === '' && clients.length > 1 && (
                      <p className="text-[11px] text-slate-400 mt-1">Tip: Select a client above to quickly filter campaigns</p>
                    )}
                  </div>

                  {/* Reporting Period */}
                  <div>
                    <Input
                      label="Reporting Period Date"
                      type="date"
                      value={formData.reporting_period}
                      onChange={(e) =>
                        setFormData({ ...formData, reporting_period: e.target.value })
                      }
                      disabled={editingId !== null}
                      required
                    />
                    {editingId && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Campaign and period date are locked during edit.
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <Input
                    label="Ad Spend ($)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000.00"
                    value={formData.ad_spend}
                    onChange={(e) =>
                      setFormData({ ...formData, ad_spend: e.target.value })
                    }
                  />

                  <Input
                    label="Impressions"
                    type="number"
                    min="0"
                    placeholder="50000"
                    value={formData.impressions}
                    onChange={(e) =>
                      setFormData({ ...formData, impressions: e.target.value })
                    }
                  />

                  <Input
                    label="Clicks"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formData.clicks}
                    onChange={(e) =>
                      setFormData({ ...formData, clicks: e.target.value })
                    }
                  />

                  <Input
                    label="Leads"
                    type="number"
                    min="0"
                    placeholder="50"
                    value={formData.leads}
                    onChange={(e) =>
                      setFormData({ ...formData, leads: e.target.value })
                    }
                  />

                  <Input
                    label="Conversions"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formData.conversions}
                    onChange={(e) =>
                      setFormData({ ...formData, conversions: e.target.value })
                    }
                  />
                </div>

                {formError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg p-2.5">
                    {formError}
                  </p>
                )}

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {editingId ? 'Update Record' : 'Save Metrics'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Focused Campaign Banner */}
          {selectedCampaign && (
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded">
                    Focused Campaign
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{selectedCampaign.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    selectedCampaign.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedCampaign.status === 'paused'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedCampaign.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                  <p>Client: <span className="font-semibold text-slate-800">{getClientName(selectedCampaign.client_id)}</span></p>
                  <span>•</span>
                  <p>Platform: <span className="font-semibold text-slate-800 capitalize">
                    {selectedCampaign.platform.replace('_', ' ')}
                  </span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCampaignId('')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <IconX className="w-3.5 h-3.5" />
                <span>Show All Campaigns</span>
              </button>
            </div>
          )}

          {/* Charts Section */}
          {sortedMetrics.length > 0 && (
            <div className="space-y-6">
              <TrendChart
                metrics={sortedMetrics}
                title={selectedCampaign ? `Metrics Over Time (${selectedCampaign.name})` : 'Cross-Campaign Performance Over Time'}
              />

              {campaigns.length > 0 && (
                <CampaignChart
                  metrics={sortedMetrics}
                  campaigns={selectedCampaign ? [selectedCampaign] : availableCampaigns}
                  title={selectedCampaign ? `${selectedCampaign.name} Breakdown` : 'Spend, Leads & Conversions by Campaign'}
                />
              )}
            </div>
          )}

          {/* Metrics Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Historical Performance Log
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {sortedMetrics.length} {sortedMetrics.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {sortedMetrics.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4 bg-white/60">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <IconMetrics className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedCampaignId
                      ? `No metrics logged for ${getCampaignName(selectedCampaignId)} in this date range`
                      : 'No metrics logged yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your campaign spend and conversion numbers to view detailed analysis.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {selectedCampaignId && (
                    <Button
                      onClick={() => setSelectedCampaignId('')}
                      variant="secondary"
                    >
                      Clear Filter
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    Enter Metrics
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600">Reporting Date</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600">Campaign (Focus)</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">Spend</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">Impressions</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">Clicks</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">Leads</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">Conversions</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">CPL</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-right">Conv. Rate</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-600 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sortedMetrics.map((metric) => {
                      const isFocused = selectedCampaignId === metric.campaign_id;
                      return (
                        <tr
                          key={metric.id}
                          className={`transition-colors ${
                            isFocused ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                            {new Date(metric.reporting_period).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCampaignId(
                                  selectedCampaignId === metric.campaign_id ? '' : metric.campaign_id
                                );
                              }}
                              className="font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                            >
                              <span>{getCampaignName(metric.campaign_id)}</span>
                              {isFocused && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                                  Focus
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            ${metric.ad_spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums whitespace-nowrap">
                            {metric.impressions.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums whitespace-nowrap">
                            {metric.clicks.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">
                            {metric.leads.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">
                            {metric.conversions.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-indigo-700 tabular-nums whitespace-nowrap">
                            {metric.cost_per_lead ? `$${metric.cost_per_lead.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                            {metric.conversion_rate ? `${metric.conversion_rate.toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(metric)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="Edit Metric"
                              >
                                <IconEdit className="w-3.5 h-3.5" />
                              </button>
                              {user?.role === 'owner' && (
                                <button
                                  onClick={() => handleDelete(metric.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Delete Metric"
                                >
                                  <IconTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table Summary Footer Bar */}
          {sortedMetrics.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Spend In View</p>
                <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                  ${sortedMetrics.reduce((sum, m) => sum + m.ad_spend, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Leads In View</p>
                <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                  {sortedMetrics.reduce((sum, m) => sum + m.leads, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Conversions</p>
                <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                  {sortedMetrics.reduce((sum, m) => sum + m.conversions, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Average Period CPL</p>
                <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                  ${(
                    sortedMetrics
                      .filter(m => m.cost_per_lead)
                      .reduce((sum, m) => sum + (m.cost_per_lead || 0), 0) /
                    (sortedMetrics.filter(m => m.cost_per_lead).length || 1)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}