// app/(dashboard)/metrics/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { TrendChart } from '@/components/charts/TrendChart';
import { CampaignChart } from '@/components/charts/CampaignChart';
import { DarkDatePicker } from '@/components/common/DarkDatePicker';
import { apiFetch } from '@/lib/utils/apiClient';
import { MetricEntry, Campaign, Client } from '@/types';
import {
  IconMetrics,
  IconDownload,
  IconEdit,
  IconTrash,
  IconPlus,
  IconX,
} from '@/components/common/Icons';
import { ConfirmModal } from '@/components/common/ConfirmModal';

function DarkDropdown({
  value,
  onChange,
  options,
  placeholder,
  align = 'left',
  className = '',
  triggerClassName,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label || placeholder || options[0]?.label || '';

  return (
    <div ref={ref} className={`relative ${className || 'inline-block'} text-left`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full inline-flex items-center justify-between gap-2.5 rounded-xl text-xs font-medium transition-all shadow-2xs border ${disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-950 border-zinc-850 text-zinc-500'
            : open
              ? 'border-zinc-700 bg-zinc-900 text-zinc-100 ring-1 ring-zinc-700/50 cursor-pointer'
              : 'border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-zinc-100 cursor-pointer'
          } ${triggerClassName || 'px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900'}`}
      >
        <span className={`truncate flex-1 text-left ${!value && placeholder ? 'text-zinc-500 font-normal' : ''}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-zinc-200' : ''
            }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          className={`absolute top-full mt-1.5 z-50 min-w-[210px] w-full max-h-60 overflow-y-auto bg-[#141416] border border-zinc-800 rounded-xl p-1 shadow-2xl shadow-black/90 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${align === 'right' ? 'right-0' : 'left-0'
            }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${isSelected
                    ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
                  }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-lime-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MetricsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const filterCampaignId = searchParams.get('campaign_id');
  const filterClientId = searchParams.get('client_id');

  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingMetric, setEditingMetric] = useState<MetricEntry | null>(null);
  const [editFormData, setEditFormData] = useState({
    ad_spend: '',
    impressions: '',
    clicks: '',
    leads: '',
    conversions: '',
  });
  const [editFormError, setEditFormError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Close edit modal on Escape key
  useEffect(() => {
    if (!editingMetric) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditSubmitting) {
        setEditingMetric(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingMetric, isEditSubmitting]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>(filterClientId || '');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(filterCampaignId || '');
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Sync URL filters if changed
  useEffect(() => {
    if (filterCampaignId) {
      setSelectedCampaignId(filterCampaignId);
    }
  }, [filterCampaignId]);

  useEffect(() => {
    if (filterClientId) {
      setSelectedClientId(filterClientId);
    }
  }, [filterClientId]);

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

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => Promise<void> | void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

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

      // Fetch metrics, campaigns, and clients concurrently
      let metricsUrl = '/api/metrics';

      if (start && end) {
        metricsUrl += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }

      const [metricsRes, campaignsRes, clientsRes] = await Promise.all([
        apiFetch(metricsUrl),
        apiFetch('/api/campaigns'),
        apiFetch('/api/clients'),
      ]);

      const [metricsData, campaignsData, clientsData] = await Promise.all([
        metricsRes.json(),
        campaignsRes.json(),
        clientsRes.json(),
      ]);

      if (!metricsData.success) {
        setError(metricsData.error || 'Failed to load metrics');
        return;
      }

      setMetrics(metricsData.metrics || []);

      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || []);
      }

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
    setEditingMetric(metric);
    setEditFormData({
      ad_spend: metric.ad_spend.toString(),
      impressions: metric.impressions.toString(),
      clicks: metric.clicks.toString(),
      leads: metric.leads.toString(),
      conversions: metric.conversions.toString(),
    });
    setEditFormError('');
  };

  const handleUpdateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMetric) return;
    setEditFormError('');

    const adSpend = parseFloat(editFormData.ad_spend || '0');
    const impressions = parseInt(editFormData.impressions || '0', 10);
    const clicks = parseInt(editFormData.clicks || '0', 10);
    const leads = parseInt(editFormData.leads || '0', 10);
    const conversions = parseInt(editFormData.conversions || '0', 10);

    if (isNaN(adSpend) || adSpend < 0) {
      setEditFormError('Ad spend must be a non-negative number');
      return;
    }
    if (isNaN(impressions) || impressions < 0) {
      setEditFormError('Impressions must be a non-negative integer');
      return;
    }
    if (isNaN(clicks) || clicks < 0) {
      setEditFormError('Clicks must be a non-negative integer');
      return;
    }
    if (isNaN(leads) || leads < 0) {
      setEditFormError('Leads must be a non-negative integer');
      return;
    }
    if (isNaN(conversions) || conversions < 0) {
      setEditFormError('Conversions must be a non-negative integer');
      return;
    }

    try {
      setIsEditSubmitting(true);
      const res = await apiFetch(`/api/metrics/${editingMetric.id}`, {
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
        setEditFormError(data.error || 'Failed to update metric entry');
        return;
      }

      // Update local state immediately with updated record from DB
      setMetrics((prev) =>
        prev.map((m) => (m.id === editingMetric.id ? data.metric : m))
      );
      setEditingMetric(null);
    } catch (err) {
      setEditFormError('Network error while updating metric. Please try again.');
      console.error('Update metric error:', err);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = (metricId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Metric Record',
      message: 'Are you sure you want to delete this metric entry? This action cannot be undone.',
      confirmText: 'Delete Metric',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await apiFetch(`/api/metrics/${metricId}`, {
            method: 'DELETE',
          });

          const data = await res.json();

          if (!data.success) {
            setError(data.error || 'Failed to delete metric');
            return;
          }

          setMetrics(metrics.filter((m) => m.id !== metricId));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError('Failed to delete metric');
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const resetForm = () => {
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
    return campaigns.find((c) => c.id === campaignId)?.name || 'Unknown Campaign';
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown Client';
  };

  const exportToCSV = () => {
    if (!selectedClientId) return;

    const activeCampaignIds = new Set(campaigns.map((c) => c.id));
    const validMetrics = metrics.filter((m) => activeCampaignIds.has(m.campaign_id));

    const clientMetrics = validMetrics
      .filter((m) => m.client_id === selectedClientId)
      .sort((a, b) => new Date(a.reporting_period).getTime() - new Date(b.reporting_period).getTime());

    if (clientMetrics.length === 0) {
      alert('No metrics found for this client in the selected date range.');
      return;
    }

    const headers = [
      'Date',
      'Campaign',
      'Ad Spend',
      'Impressions',
      'Clicks',
      'Leads',
      'Conversions',
      'CPL',
      'Conversion Rate',
    ];

    const rows = clientMetrics.map((m) => [
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

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const clientName = clients.find((c) => c.id === selectedClientId)?.name || 'client';
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

  // Ensure metrics only include entries with existing campaigns in the active workspace
  const activeCampaignIds = new Set(campaigns.map((c) => c.id));
  const validMetrics = metrics.filter((m) => activeCampaignIds.has(m.campaign_id));

  // Step 1: Filter by selected client (if any)
  const clientFilteredMetrics = selectedClientId
    ? validMetrics.filter((m) => m.client_id === selectedClientId)
    : validMetrics;

  // Step 2: Filter by selected campaign (clicked in table or selector)
  const campaignFilteredMetrics = selectedCampaignId
    ? clientFilteredMetrics.filter((m) => m.campaign_id === selectedCampaignId)
    : clientFilteredMetrics;

  // Unique reporting periods available in the current view, newest first
  const availablePeriods = [...new Set(campaignFilteredMetrics.map((m) => m.reporting_period))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatPeriod = (period: string) =>
    new Date(period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Further filter by the selected month, if one is chosen
  const periodFilteredMetrics =
    selectedPeriod === 'all'
      ? campaignFilteredMetrics
      : campaignFilteredMetrics.filter((m) => m.reporting_period === selectedPeriod);

  // Sort by reporting period (newest first)
  const sortedMetrics = [...periodFilteredMetrics].sort(
    (a, b) => new Date(b.reporting_period).getTime() - new Date(a.reporting_period).getTime()
  );

  // Filter campaigns list for campaign dropdown and chart:
  // Only include campaigns belonging to the current workspace/client that actually have active metrics in view
  const activeMetricCampaignIds = new Set(
    (selectedClientId ? validMetrics.filter((m) => m.client_id === selectedClientId) : validMetrics)
      .map((m) => m.campaign_id)
  );

  const availableCampaigns = campaigns.filter(
    (c) =>
      (!selectedClientId || c.client_id === selectedClientId) &&
      activeMetricCampaignIds.has(c.id)
  );

  // Selected campaign object for info display
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Reset selectedCampaignId if the selected campaign is not available in the current view
  useEffect(() => {
    if (selectedCampaignId && !availableCampaigns.some((c) => c.id === selectedCampaignId)) {
      setSelectedCampaignId('');
    }
  }, [availableCampaigns, selectedCampaignId]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-lime-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-zinc-500">Loading campaign metrics...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Campaign Metrics</h1>
                {filterCampaignId && (
                  <span className="text-xs font-semibold text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 rounded-full">
                    {getCampaignName(filterCampaignId)}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {filterCampaignId
                  ? `Performance records for ${getCampaignName(filterCampaignId)}`
                  : 'Track and analyze cross-platform marketing performance records'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              {availablePeriods.length > 1 && (
                <DarkDropdown
                  value={selectedPeriod}
                  onChange={(val) => setSelectedPeriod(val)}
                  align="right"
                  triggerClassName="px-3 py-2 bg-zinc-900 hover:bg-zinc-850"
                  options={[
                    { value: 'all', label: 'All reporting periods' },
                    ...availablePeriods.map((period) => ({
                      value: period,
                      label: formatPeriod(period),
                    })),
                  ]}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (showForm) {
                    resetForm();
                  }
                  setShowForm(!showForm);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{showForm ? 'Cancel' : 'Enter Metrics'}</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Client Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">Client:</span>
                <DarkDropdown
                  value={selectedClientId}
                  onChange={(val) => {
                    setSelectedClientId(val);
                    setSelectedCampaignId('');
                    setSelectedPeriod('all');
                  }}
                  placeholder="All client accounts"
                  options={[
                    ...(clients.length > 1
                      ? [{ value: '', label: 'All client accounts' }]
                      : []),
                    ...clients.map((client) => ({
                      value: client.id,
                      label: client.name,
                    })),
                  ]}
                />
              </div>

              {/* Campaign Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">Campaign:</span>
                <DarkDropdown
                  value={selectedCampaignId}
                  onChange={(val) => {
                    setSelectedCampaignId(val);
                    setSelectedPeriod('all');
                  }}
                  placeholder="All active campaigns"
                  options={[
                    { value: '', label: 'All active campaigns' },
                    ...availableCampaigns.map((campaign) => ({
                      value: campaign.id,
                      label: campaign.name,
                    })),
                  ]}
                />
                {selectedCampaignId && (
                  <button
                    onClick={() => setSelectedCampaignId('')}
                    className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
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
                type="button"
                onClick={exportToCSV}
                disabled={!selectedClientId}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-300 hover:text-zinc-100 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                <IconDownload className="w-3.5 h-3.5 text-zinc-400" />
                <span>Export CSV</span>
              </button>
              {!selectedClientId && (
                <span className="text-[11px] text-zinc-500 italic">Select client to export</span>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-3.5 sm:p-4">
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
            <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-4">
              <p className="text-xs sm:text-sm text-rose-400 font-medium">{error}</p>
            </div>
          )}

          {/* Metric Entry Form */}
          {showForm && (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-100">
                  Log New Campaign Metrics
                </h2>
                <span className="text-xs text-zinc-500 font-mono">Periodic reporting data</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campaign Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Target Campaign <span className="text-lime-400">*</span>
                    </label>
                    <DarkDropdown
                      value={formData.campaign_id}
                      onChange={(val) =>
                        setFormData({ ...formData, campaign_id: val })
                      }
                      placeholder="Select a campaign..."
                      className="w-full"
                      triggerClassName="w-full h-11 bg-zinc-950 hover:bg-zinc-900 border-zinc-800 px-4 text-sm font-normal"
                      options={[
                        { value: '', label: 'Select a campaign...' },
                        ...campaigns
                          .filter((c) => !selectedClientId || c.client_id === selectedClientId)
                          .map((campaign) => ({
                            value: campaign.id,
                            label: campaign.name,
                          })),
                      ]}
                    />
                    {selectedClientId === '' && clients.length > 1 && (
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Tip: Select a client above to quickly filter campaigns
                      </p>
                    )}
                  </div>

                  {/* Reporting Period */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Reporting Period Date <span className="text-lime-400">*</span>
                    </label>
                    <DarkDatePicker
                      value={formData.reporting_period}
                      onChange={(val) =>
                        setFormData({ ...formData, reporting_period: val })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Ad Spend ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1000.00"
                      value={formData.ad_spend}
                      onChange={(e) =>
                        setFormData({ ...formData, ad_spend: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Impressions</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="50000"
                      value={formData.impressions}
                      onChange={(e) =>
                        setFormData({ ...formData, impressions: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Clicks</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="500"
                      value={formData.clicks}
                      onChange={(e) =>
                        setFormData({ ...formData, clicks: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Leads</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="50"
                      value={formData.leads}
                      onChange={(e) =>
                        setFormData({ ...formData, leads: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">Conversions</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="10"
                      value={formData.conversions}
                      onChange={(e) =>
                        setFormData({ ...formData, conversions: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-xl p-3">
                    {formError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold transition-all active:scale-98 disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Metrics'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Focused Campaign Banner */}
          {selectedCampaign && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2 py-0.5 rounded">
                    Focused Campaign
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100">{selectedCampaign.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedCampaign.status === 'active'
                        ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                        : selectedCampaign.status === 'paused'
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedCampaign.status === 'active'
                          ? 'bg-lime-400'
                          : selectedCampaign.status === 'paused'
                            ? 'bg-amber-400'
                            : 'bg-zinc-500'
                        }`}
                    />
                    <span className="capitalize">{selectedCampaign.status}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-0.5">
                  <p>
                    Client:{' '}
                    <span className="font-semibold text-zinc-200">
                      {getClientName(selectedCampaign.client_id)}
                    </span>
                  </p>
                  <span className="text-zinc-700">•</span>
                  <p>
                    Platform:{' '}
                    <span className="font-semibold text-zinc-200 capitalize">
                      {selectedCampaign.platform.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaignId('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-zinc-100 border border-zinc-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
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
                title={
                  selectedCampaign
                    ? `Metrics Over Time (${selectedCampaign.name})`
                    : 'Cross-Campaign Performance Over Time'
                }
              />

              {campaigns.length > 0 && (
                <CampaignChart
                  metrics={sortedMetrics}
                  campaigns={selectedCampaign ? [selectedCampaign] : availableCampaigns}
                  title={
                    selectedCampaign
                      ? `${selectedCampaign.name} Breakdown`
                      : 'Spend, Leads & Conversions by Campaign'
                  }
                />
              )}
            </div>
          )}

          {/* Metrics Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Historical Performance Log
              </h2>
              <span className="text-xs text-zinc-500 font-medium">
                {sortedMetrics.length} {sortedMetrics.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {sortedMetrics.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800/90 p-12 text-center space-y-4 bg-[#111113]/50">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400 flex items-center justify-center mx-auto">
                  <IconMetrics className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-200">
                    {selectedCampaignId
                      ? `No metrics logged for ${getCampaignName(selectedCampaignId)} in this date range`
                      : 'No metrics logged yet'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Enter your campaign spend and conversion numbers to view detailed analysis.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {selectedCampaignId && (
                    <button
                      type="button"
                      onClick={() => setSelectedCampaignId('')}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    Enter Metrics
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto bg-[#111113] rounded-2xl border border-zinc-800/80 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800/80">
                    <tr>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Reporting Date
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Campaign (Focus)
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Spend
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Impressions
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Clicks
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Leads
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Conversions
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        CPL
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Conv. Rate
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {sortedMetrics.map((metric) => {
                      const isFocused = selectedCampaignId === metric.campaign_id;
                      return (
                        <tr
                          key={metric.id}
                          className={`transition-colors ${isFocused
                              ? 'bg-lime-400/5 hover:bg-lime-400/10'
                              : 'hover:bg-zinc-900/50'
                            }`}
                        >
                          <td className="px-5 py-3.5 font-medium text-zinc-400 whitespace-nowrap">
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
                              className="font-semibold text-zinc-200 hover:text-lime-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                            >
                              <span>{getCampaignName(metric.campaign_id)}</span>
                              {isFocused && (
                                <span className="text-[10px] bg-lime-400/15 text-lime-400 border border-lime-400/30 px-1.5 py-0.5 rounded font-mono font-bold">
                                  Focus
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-zinc-100 tabular-nums whitespace-nowrap">
                            ${metric.ad_spend.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-400 tabular-nums whitespace-nowrap">
                            {metric.impressions.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-400 tabular-nums whitespace-nowrap">
                            {metric.clicks.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-zinc-200 tabular-nums whitespace-nowrap">
                            {metric.leads.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-zinc-200 tabular-nums whitespace-nowrap">
                            {metric.conversions.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-zinc-300 tabular-nums whitespace-nowrap">
                            {metric.cost_per_lead ? `$${metric.cost_per_lead.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-lime-400 tabular-nums whitespace-nowrap">
                            {metric.conversion_rate ? `${metric.conversion_rate.toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(metric)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
                                title="Edit Metric"
                              >
                                <IconEdit className="w-3.5 h-3.5" />
                              </button>
                              {user?.role === 'owner' && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(metric.id)}
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 transition-all duration-200">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Total Spend In View
                </p>
                <p className="text-2xl font-bold text-zinc-100 mt-2 tracking-tight tabular-nums">
                  ${sortedMetrics
                    .reduce((sum, m) => sum + m.ad_spend, 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>

              <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 transition-all duration-200">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Total Leads In View
                </p>
                <p className="text-2xl font-bold text-zinc-100 mt-2 tracking-tight tabular-nums">
                  {sortedMetrics.reduce((sum, m) => sum + m.leads, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 transition-all duration-200">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Total Conversions
                </p>
                <p className="text-2xl font-bold text-zinc-100 mt-2 tracking-tight tabular-nums">
                  {sortedMetrics.reduce((sum, m) => sum + m.conversions, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 transition-all duration-200">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Average Period CPL
                </p>
                <p className="text-2xl font-bold text-zinc-100 mt-2 tracking-tight tabular-nums">
                  ${(
                    sortedMetrics
                      .filter((m) => m.cost_per_lead)
                      .reduce((sum, m) => sum + (m.cost_per_lead || 0), 0) /
                    (sortedMetrics.filter((m) => m.cost_per_lead).length || 1)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Metric Record Modal */}
        {editingMetric && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="fixed inset-0"
              onClick={() => {
                if (!isEditSubmitting) setEditingMetric(null);
              }}
            />
            <div className="relative w-full max-w-lg bg-[#141416] border border-zinc-800/90 rounded-2xl p-6 shadow-2xl shadow-black/95 space-y-5 animate-in zoom-in-95 duration-150 z-10">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
                    <IconEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                      Edit Metric Record
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Update performance numbers for this reporting period
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isEditSubmitting}
                  onClick={() => setEditingMetric(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              {/* Locked Context Summary (Campaign & Date) */}
              <div className="bg-zinc-950 rounded-xl p-3.5 border border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Campaign</span>
                  <span className="text-zinc-200 font-semibold truncate block mt-0.5">
                    {getCampaignName(editingMetric.campaign_id)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Reporting Date</span>
                  <span className="text-zinc-200 font-semibold block mt-0.5">
                    {new Date(editingMetric.reporting_period).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleUpdateMetric} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Ad Spend */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Ad Spend ($) <span className="text-lime-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={editFormData.ad_spend}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, ad_spend: e.target.value })
                      }
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  {/* Impressions */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Impressions
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editFormData.impressions}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, impressions: e.target.value })
                      }
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  {/* Clicks */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Clicks
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editFormData.clicks}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, clicks: e.target.value })
                      }
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  {/* Leads */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Leads
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editFormData.leads}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, leads: e.target.value })
                      }
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>

                  {/* Conversions */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Conversions
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editFormData.conversions}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, conversions: e.target.value })
                      }
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Live Computed KPIs Preview */}
                {(() => {
                  const spend = parseFloat(editFormData.ad_spend || '0');
                  const leads = parseInt(editFormData.leads || '0', 10);
                  const conv = parseInt(editFormData.conversions || '0', 10);
                  const cpl = leads > 0 ? (spend / leads).toFixed(2) : null;
                  const cvr = leads > 0 ? ((conv / leads) * 100).toFixed(1) : null;

                  return (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60 text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400">
                          Calculated CPL:{' '}
                          <strong className="text-zinc-200 font-mono">
                            {cpl ? `$${cpl}` : '—'}
                          </strong>
                        </span>
                        <span className="text-zinc-400">
                          Conv. Rate:{' '}
                          <strong className="text-lime-400 font-mono">
                            {cvr ? `${cvr}%` : '—'}
                          </strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">Live calculation</span>
                    </div>
                  );
                })()}

                {/* Error Banner */}
                {editFormError && (
                  <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-3 text-xs text-rose-400 font-medium">
                    {editFormError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                  <button
                    type="button"
                    disabled={isEditSubmitting}
                    onClick={() => setEditingMetric(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-zinc-100 text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    {isEditSubmitting && (
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    <span>{isEditSubmitting ? 'Updating...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Dark Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
          isLoading={confirmModal.isLoading}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}