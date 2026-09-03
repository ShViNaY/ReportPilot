// app/(dashboard)/metrics/page.tsx

'use client';

import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';
import { TrendChart } from '@/components/charts/TrendChart';
import { CampaignChart } from '@/components/charts/CampaignChart';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { apiFetch } from '@/lib/utils/apiClient';
import { MetricEntry, Campaign, Client } from '@/types';

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
    const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

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

                if (filterCampaignId) {
                    metricsUrl += `&campaign_id=${filterCampaignId}`;
                }
            } else if (filterCampaignId) {
                metricsUrl += `?campaign_id=${filterCampaignId}`;
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

    // Filter metrics if campaign_id is provided
    const filteredMetrics = filterCampaignId
        ? metrics.filter(m => m.campaign_id === filterCampaignId)
        : metrics;

    // Unique reporting periods available in the current view, newest first
    const availablePeriods = [...new Set(filteredMetrics.map(m => m.reporting_period))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const formatPeriod = (period: string) =>
        new Date(period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Further filter by the selected month, if one is chosen
    const periodFilteredMetrics =
        selectedPeriod === 'all'
            ? filteredMetrics
            : filteredMetrics.filter(m => m.reporting_period === selectedPeriod);

    // Sort by reporting period (newest first)
    const sortedMetrics = [...periodFilteredMetrics].sort(
        (a, b) => new Date(b.reporting_period).getTime() - new Date(a.reporting_period).getTime()
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
                            <p className="text-slate-600 mt-4">Loading metrics...</p>
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
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Campaign Metrics</h1>
                            <p className="text-slate-500 mt-1">
                                {filterCampaignId
                                    ? `Metrics for ${getCampaignName(filterCampaignId)}`
                                    : 'Track all campaign performance metrics'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {availablePeriods.length > 1 && (
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                >
                                    <option value="all">All periods</option>
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {showForm ? 'Cancel' : '+ Add Metrics'}
                            </Button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
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
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Metric Entry Form */}
                    {showForm && (
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                {editingId ? 'Edit Metric Entry' : 'Enter Campaign Metrics'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Campaign Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Campaign
                                        </label>
                                        <select
                                            value={formData.campaign_id}
                                            onChange={(e) =>
                                                setFormData({ ...formData, campaign_id: e.target.value })
                                            }
                                            disabled={editingId !== null}
                                            className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
                                            required
                                        >
                                            <option value="">Select a campaign...</option>
                                            {campaigns.map(campaign => (
                                                <option key={campaign.id} value={campaign.id}>
                                                    {campaign.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Reporting Period */}
                                    <div>
                                        <Input
                                            label="Reporting Period"
                                            type="date"
                                            value={formData.reporting_period}
                                            onChange={(e) =>
                                                setFormData({ ...formData, reporting_period: e.target.value })
                                            }
                                            disabled={editingId !== null}
                                            required
                                        />
                                        {editingId && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Campaign and period can't be changed once created — delete and re-enter if needed.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                    <Input
                                        label="Ad Spend ($)"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="1000"
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
                                    <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                                        {formError}
                                    </p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        isLoading={isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {editingId ? 'Update Metric' : 'Submit Metrics'}
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

                    {/* Charts */}
                    {sortedMetrics.length > 0 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Trends</h2>
                                <TrendChart metrics={sortedMetrics} title="Metrics Over Time" />
                            </div>

                            {campaigns.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Campaign Performance</h2>
                                    <CampaignChart
                                        metrics={sortedMetrics}
                                        campaigns={campaigns}
                                        title="Ad Spend, Leads & Conversions by Campaign"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metrics Table */}
                    {sortedMetrics.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
                            <p className="text-slate-600 mb-4">
                                {filterCampaignId ? 'No metrics for this campaign' : 'No metrics entered yet'}
                            </p>
                            <Button
                                onClick={() => setShowForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Enter Your First Metric
                            </Button>
                        </div>
                    ) : (
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
                                            Impressions
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900">
                                            Clicks
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
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sortedMetrics.map(metric => (
                                        <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                                {new Date(metric.reporting_period).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {getCampaignName(metric.campaign_id)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">
                                                ${metric.ad_spend.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900 text-right">
                                                {metric.impressions.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900 text-right">
                                                {metric.clicks.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">
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
                                            <td className="px-6 py-4 text-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(metric)}
                                                    className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
                                                >
                                                    Edit
                                                </button>
                                                {user?.role === 'owner' && (
                                                    <button
                                                        onClick={() => handleDelete(metric.id)}
                                                        className="text-red-600 hover:text-red-700 font-medium text-xs"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Summary Stats */}
                    {sortedMetrics.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                            <div className="bg-indigo-50 rounded-lg p-4">
                                <p className="text-xs text-indigo-600 font-medium">Total Ad Spend</p>
                                <p className="text-2xl font-bold text-indigo-900 mt-2">
                                    ${sortedMetrics.reduce((sum, m) => sum + m.ad_spend, 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-xs text-green-600 font-medium">Total Leads</p>
                                <p className="text-2xl font-bold text-green-900 mt-2">
                                    {sortedMetrics.reduce((sum, m) => sum + m.leads, 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-xs text-blue-600 font-medium">Total Conversions</p>
                                <p className="text-2xl font-bold text-blue-900 mt-2">
                                    {sortedMetrics.reduce((sum, m) => sum + m.conversions, 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4">
                                <p className="text-xs text-purple-600 font-medium">Avg CPL</p>
                                <p className="text-2xl font-bold text-purple-900 mt-2">
                                    ${(
                                        sortedMetrics
                                            .filter(m => m.cost_per_lead)
                                            .reduce((sum, m) => sum + (m.cost_per_lead || 0), 0) /
                                        sortedMetrics.filter(m => m.cost_per_lead).length || 0
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