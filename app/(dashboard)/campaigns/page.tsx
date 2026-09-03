// app/(dashboard)/campaigns/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { useAuth } from '@/lib/context/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { apiFetch } from '@/lib/utils/apiClient';
import { Campaign, Client } from '@/types';

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

  // Form state
  const [formData, setFormData] = useState({
    client_id: filterClientId || '',
    name: '',
    platform: 'google_ads' as 'google_ads' | 'meta_ads' | 'other',
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

    try {
      setIsSubmitting(true);
      const res = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || 'Failed to create campaign');
        return;
      }

      // Reset form and refresh list
      setFormData({
        client_id: filterClientId || '',
        name: '',
        platform: 'google_ads',
      });
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
              <p className="text-slate-600 mt-4">Loading campaigns...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
              <p className="text-slate-500 mt-1">
                {filterClientId
                  ? `Campaigns for ${getClientName(filterClientId)}`
                  : 'Manage all your marketing campaigns'}
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {showForm ? 'Cancel' : '+ Add Campaign'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Create New Campaign
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) =>
                      setFormData({ ...formData, client_id: e.target.value })
                    }
                    className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    required
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Campaign Name"
                  type="text"
                  placeholder="Summer Sale - Google Ads"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                {/* Platform Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value as 'google_ads' | 'meta_ads' | 'other',
                      })
                    }
                    className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  >
                    <option value="google_ads">Google Ads</option>
                    <option value="meta_ads">Meta Ads</option>
                    <option value="other">Other</option>
                  </select>
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
                    Create Campaign
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
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
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-600 mb-4">
                {filterClientId ? 'No campaigns for this client' : 'No campaigns yet'}
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {campaign.name}
                        </h3>
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-slate-600">
                          Client: <span className="font-medium">{getClientName(campaign.client_id)}</span>
                        </p>
                        <p className="text-sm text-slate-600">
                          Platform:{' '}
                          <span className="font-medium capitalize">
                            {campaign.platform.replace('_', ' ')}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Created {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Status Dropdown */}
                      <select
                        value={campaign.status}
                        onChange={(e) =>
                          handleStatusChange(
                            campaign.id,
                            e.target.value as 'active' | 'paused' | 'completed'
                          )
                        }
                        className="px-3 py-2 text-sm border border-slate-300 rounded hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>

                      {/* View Metrics Button */}
                      
                        <a href={`/metrics?campaign_id=${campaign.id}`}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-sm font-medium text-center transition-colors"
                      >
                        View Metrics
                      </a>

                      {/* Delete Button — owner only */}
                      {user?.role === 'owner' && (
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}