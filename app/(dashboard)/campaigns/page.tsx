// app/(dashboard)/campaigns/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { useAuth } from '@/lib/context/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { apiFetch } from '@/lib/utils/apiClient';
import { Campaign, Client } from '@/types';
import {
  IconCampaigns,
  IconEdit,
  IconTrash,
  IconMetrics,
  IconPlus,
  IconArrowUpRight,
} from '@/components/common/Icons';

export default function CampaignsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const filterClientId = searchParams.get('client_id');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_id: filterClientId || '',
    name: '',
    platform: 'google_ads',
    custom_platform: '',
  });
  const [formError, setFormError] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch campaigns
      const campaignsRes = await apiFetch('/api/campaigns');
      const campaignsData = await campaignsRes.json();

      if (!campaignsData.success) {
        setError(campaignsData.error || 'Failed to load campaigns');
        return;
      }

      setCampaigns(campaignsData.campaigns || []);

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

  const resetForm = () => {
    setEditingCampaignId(null);
    setFormData({
      client_id: filterClientId || '',
      name: '',
      platform: 'google_ads',
      custom_platform: '',
    });
    setFormError('');
  };

  const handleEdit = (campaign: Campaign) => {
    const isKnown = ['google_ads', 'meta_ads'].includes(campaign.platform);
    setEditingCampaignId(campaign.id);
    setFormData({
      client_id: campaign.client_id,
      name: campaign.name,
      platform: isKnown ? campaign.platform : 'other',
      custom_platform: isKnown ? '' : campaign.platform,
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.client_id) {
      setFormError('Please select a client');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Campaign name is required');
      return;
    }

    const finalPlatform =
      formData.platform === 'other'
        ? formData.custom_platform.trim() || 'Other'
        : formData.platform;

    if (formData.platform === 'other' && !formData.custom_platform.trim()) {
      setFormError('Please specify the platform name');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingCampaignId) {
        // Update existing campaign
        const res = await apiFetch(`/api/campaigns/${editingCampaignId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name.trim(),
            platform: finalPlatform,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setFormError(data.error || 'Failed to update campaign');
          return;
        }

        // Update local state and refresh
        setCampaigns(
          campaigns.map((c) => (c.id === editingCampaignId ? data.campaign : c))
        );
      } else {
        // Create new campaign
        const res = await apiFetch('/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            client_id: formData.client_id,
            name: formData.name.trim(),
            platform: finalPlatform,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setFormError(data.error || 'Failed to create campaign');
          return;
        }
      }

      resetForm();
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError('Something went wrong');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    campaignId: string,
    newStatus: 'active' | 'paused' | 'completed'
  ) => {
    try {
      const res = await apiFetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to update campaign');
        return;
      }

      // Update local state
      setCampaigns(
        campaigns.map(c =>
          c.id === campaignId ? { ...c, status: newStatus } : c
        )
      );
    } catch (err) {
      setError('Failed to update campaign');
      console.error(err);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure? This will delete all metrics for this campaign.')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to delete campaign');
        return;
      }

      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (err) {
      setError('Failed to delete campaign');
      console.error(err);
    }
  };

  // Get client name by ID
  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  // Filter campaigns if client_id is provided
  const filteredCampaigns = filterClientId
    ? campaigns.filter(c => c.client_id === filterClientId)
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
              <p className="text-sm font-medium text-slate-500">Loading campaigns...</p>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
                {filterClientId && (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                    Filtered: {getClientName(filterClientId)}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {filterClientId
                  ? `Showing active campaigns for ${getClientName(filterClientId)}`
                  : 'Manage and monitor all active agency advertising channels'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {filterClientId && (
                <Link
                  href="/campaigns"
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  View All Clients
                </Link>
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
                {showForm ? 'Cancel' : '+ Add Campaign'}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4">
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* Create / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">
                  {editingCampaignId ? 'Edit Campaign Details' : 'Launch New Campaign'}
                </h2>
                <span className="text-xs text-slate-400">
                  {editingCampaignId ? 'Updating existing record' : 'Agency campaign setup'}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                    Client Account
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) =>
                      setFormData({ ...formData, client_id: e.target.value })
                    }
                    disabled={editingCampaignId !== null}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 shadow-2xs"
                    required
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {editingCampaignId && (
                    <p className="text-[11px] text-slate-400 mt-1">Client cannot be changed once created.</p>
                  )}
                </div>

                <Input
                  label="Campaign Name"
                  type="text"
                  placeholder="e.g. Q4 Brand Awareness - Search"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                {/* Platform Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                    Platform Channel
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value,
                      })
                    }
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 shadow-2xs"
                  >
                    <option value="google_ads">Google Ads</option>
                    <option value="meta_ads">Meta Ads</option>
                    <option value="other">Other (Custom platform)</option>
                  </select>
                </div>

                {/* Custom Platform Input when 'other' is selected */}
                {formData.platform === 'other' && (
                  <Input
                    label="Specify Platform Name"
                    type="text"
                    placeholder="e.g. LinkedIn, TikTok, X, Pinterest"
                    value={formData.custom_platform}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_platform: e.target.value })
                    }
                    required
                  />
                )}

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
                    {editingCampaignId ? 'Update Campaign' : 'Create Campaign'}
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

          {/* Campaigns List */}
          {filteredCampaigns.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4 bg-white/60">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <IconCampaigns className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">
                  {filterClientId ? 'No campaigns found for this client' : 'No campaigns yet'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your first marketing campaign to start logging impressions, leads, and spend.
                </p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCampaigns.map((campaign) => {
                const isGoogle = campaign.platform === 'google_ads';
                const isMeta = campaign.platform === 'meta_ads';
                const platformLabel = isGoogle
                  ? 'Google Ads'
                  : isMeta
                  ? 'Meta Ads'
                  : campaign.platform.replace('_', ' ');

                return (
                  <div
                    key={campaign.id}
                    className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Campaign Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            {campaign.name}
                          </h3>

                          {/* Status Pill Badge with Dot */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              campaign.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : campaign.status === 'paused'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
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
                            <span className="capitalize">{campaign.status}</span>
                          </span>

                          {/* Platform Badge */}
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            {platformLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <p>
                            Client:{' '}
                            <span className="font-semibold text-slate-800">
                              {getClientName(campaign.client_id)}
                            </span>
                          </p>
                          <span>•</span>
                          <p>
                            Created {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                        {/* Status Select */}
                        <select
                          value={campaign.status}
                          onChange={(e) =>
                            handleStatusChange(
                              campaign.id,
                              e.target.value as 'active' | 'paused' | 'completed'
                            )
                          }
                          className="px-2.5 py-1.5 text-xs bg-white text-slate-800 border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-medium cursor-pointer shadow-2xs"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                        </select>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEdit(campaign)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <IconEdit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {/* View Metrics Link */}
                        <Link
                          href={`/metrics?campaign_id=${campaign.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <IconMetrics className="w-3.5 h-3.5" />
                          <span>Metrics</span>
                        </Link>

                        {/* Delete Button — owner only */}
                        {user?.role === 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(campaign.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Delete Campaign"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}