// app/(dashboard)/campaigns/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { useAuth } from '@/lib/context/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { apiFetch } from '@/lib/utils/apiClient';
import { Campaign, Client } from '@/types';
import {
  IconCampaigns,
  IconEdit,
  IconTrash,
  IconMetrics,
  IconPlus,
} from '@/components/common/Icons';
import { ConfirmModal } from '@/components/common/ConfirmModal';

function CampaignStatusSelect({
  status,
  onChange,
}: {
  status: 'active' | 'paused' | 'completed';
  onChange: (status: 'active' | 'paused' | 'completed') => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const options: Array<{
    value: 'active' | 'paused' | 'completed';
    label: string;
    dotColor: string;
  }> = [
    { value: 'active', label: 'Active', dotColor: 'bg-lime-400' },
    { value: 'paused', label: 'Paused', dotColor: 'bg-amber-400' },
    { value: 'completed', label: 'Completed', dotColor: 'bg-zinc-500' },
  ];

  const currentOption = options.find((opt) => opt.value === status) || options[0];

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs focus:outline-none focus:border-zinc-700"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotColor}`} />
        <span className="capitalize">{currentOption.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
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

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-36 bg-[#141416] border border-zinc-800 rounded-xl p-1 shadow-xl shadow-black/80 space-y-0.5">
          {options.map((option) => {
            const isSelected = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${option.dotColor}`} />
                <span className="flex-1">{option.label}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-lime-400"
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
    onConfirm: () => {},
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch campaigns and clients concurrently
      const [campaignsRes, clientsRes] = await Promise.all([
        apiFetch('/api/campaigns'),
        apiFetch('/api/clients'),
      ]);

      const [campaignsData, clientsData] = await Promise.all([
        campaignsRes.json(),
        clientsRes.json(),
      ]);

      if (!campaignsData.success) {
        setError(campaignsData.error || 'Failed to load campaigns');
        return;
      }

      setCampaigns(campaignsData.campaigns || []);

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
        campaigns.map((c) =>
          c.id === campaignId ? { ...c, status: newStatus } : c
        )
      );
    } catch (err) {
      setError('Failed to update campaign');
      console.error(err);
    }
  };

  const handleDelete = (campaignId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Campaign',
      message: 'Are you sure? This will delete all metrics for this campaign. This action cannot be undone.',
      confirmText: 'Delete Campaign',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await apiFetch(`/api/campaigns/${campaignId}`, {
            method: 'DELETE',
          });

          const data = await res.json();

          if (!data.success) {
            setError(data.error || 'Failed to delete campaign');
            return;
          }

          setCampaigns(campaigns.filter((c) => c.id !== campaignId));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError('Failed to delete campaign');
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Get client name by ID
  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown Client';
  };

  // Filter campaigns if client_id is provided
  const filteredCampaigns = filterClientId
    ? campaigns.filter((c) => c.client_id === filterClientId)
    : campaigns;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-lime-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-zinc-500">Loading campaigns...</p>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Campaigns</h1>
                {filterClientId && (
                  <span className="text-xs font-semibold text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 rounded-full">
                    Filtered: {getClientName(filterClientId)}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {filterClientId
                  ? `Showing active campaigns for ${getClientName(filterClientId)}`
                  : 'Manage and monitor all active agency advertising channels'}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {filterClientId && (
                <Link
                  href="/campaigns"
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-full text-xs font-medium transition-colors"
                >
                  View All Clients
                </Link>
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
                <span>{showForm ? 'Cancel' : 'Add Campaign'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-4">
              <p className="text-xs sm:text-sm text-rose-400 font-medium">{error}</p>
            </div>
          )}

          {/* Create / Edit Form */}
          {showForm && (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-100">
                  {editingCampaignId ? 'Edit Campaign Details' : 'Launch New Campaign'}
                </h2>
                <span className="text-xs text-zinc-500 font-mono">
                  {editingCampaignId ? 'Updating existing record' : 'Agency campaign setup'}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Client Account <span className="text-lime-400">*</span>
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) =>
                      setFormData({ ...formData, client_id: e.target.value })
                    }
                    disabled={editingCampaignId !== null}
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 disabled:opacity-50 transition-colors cursor-pointer"
                    required
                  >
                    <option value="" className="bg-zinc-950 text-zinc-300">
                      Select a client...
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-zinc-900 text-zinc-200">
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {editingCampaignId && (
                    <p className="text-[11px] text-zinc-500 mt-1">Client cannot be changed once created.</p>
                  )}
                </div>

                {/* Campaign Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Campaign Name <span className="text-lime-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Brand Awareness - Search"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                  />
                </div>

                {/* Platform Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
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
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors cursor-pointer"
                  >
                    <option value="google_ads" className="bg-zinc-950 text-zinc-200">
                      Google Ads
                    </option>
                    <option value="meta_ads" className="bg-zinc-950 text-zinc-200">
                      Meta Ads
                    </option>
                    <option value="other" className="bg-zinc-950 text-zinc-200">
                      Other (Custom platform)
                    </option>
                  </select>
                </div>

                {/* Custom Platform Input when 'other' is selected */}
                {formData.platform === 'other' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Specify Platform Name <span className="text-lime-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LinkedIn, TikTok, X, Pinterest"
                      value={formData.custom_platform}
                      onChange={(e) =>
                        setFormData({ ...formData, custom_platform: e.target.value })
                      }
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                    />
                  </div>
                )}

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
                    {isSubmitting ? 'Saving...' : editingCampaignId ? 'Update Campaign' : 'Create Campaign'}
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

          {/* Campaigns List */}
          {filteredCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800/90 p-12 text-center space-y-4 bg-[#111113]/50">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400 flex items-center justify-center mx-auto">
                <IconCampaigns className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-200">
                  {filterClientId ? 'No campaigns found for this client' : 'No campaigns yet'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Create your first marketing campaign to start logging impressions, leads, and spend.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                Create Your First Campaign
              </button>
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
                    className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 sm:p-6 hover:border-zinc-700 transition-all duration-200 shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Campaign Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                            {campaign.name}
                          </h3>

                          {/* Status Pill Badge with Dot */}
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

                          {/* Platform Badge */}
                          <span className="text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-lg">
                            {platformLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <p>
                            Client:{' '}
                            <span className="font-semibold text-zinc-300">
                              {getClientName(campaign.client_id)}
                            </span>
                          </p>
                          <span className="text-zinc-700">•</span>
                          <p>
                            Created {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                        {/* Status Select */}
                        <CampaignStatusSelect
                          status={campaign.status}
                          onChange={(newStatus) =>
                            handleStatusChange(campaign.id, newStatus)
                          }
                        />

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEdit(campaign)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                        >
                          <IconEdit className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Edit</span>
                        </button>

                        {/* View Metrics Link */}
                        <Link
                          href={`/metrics?campaign_id=${campaign.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                        >
                          <IconMetrics className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Metrics</span>
                        </Link>

                        {/* Delete Button — owner only */}
                        {user?.role === 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(campaign.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-xl transition-colors border border-transparent hover:border-zinc-800 cursor-pointer"
                            title="Delete Campaign"
                            aria-label="Delete Campaign"
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