// app/(dashboard)/clients/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { apiFetch } from '@/lib/utils/apiClient';
import { Client } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
  });
  const [formError, setFormError] = useState('');

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/clients');
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to load clients');
        return;
      }

      setClients(data.clients || []);
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

    if (!formData.name.trim()) {
      setFormError('Client name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || 'Failed to create client');
        return;
      }

      // Reset form and refresh list
      setFormData({ name: '', contact_email: '' });
      setShowForm(false);
      await fetchClients();
    } catch (err) {
      setFormError('Something went wrong');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure? This will delete all campaigns and metrics for this client.')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to delete client');
        return;
      }

      setClients(clients.filter(c => c.id !== clientId));
    } catch (err) {
      setError('Failed to delete client');
      console.error(err);
    }
  };

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
              <p className="text-slate-600 mt-4">Loading clients...</p>
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
              <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
              <p className="text-slate-500 mt-1">
                Manage your marketing clients and their campaigns.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {showForm ? 'Cancel' : '+ Add Client'}
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
                Create New Client
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Client Name"
                  type="text"
                  placeholder="ABC Furniture"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <Input
                  label="Contact Email (Optional)"
                  type="email"
                  placeholder="owner@abcfurniture.com"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                />

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
                    Create Client
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

          {/* Clients List */}
          {clients.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-600 mb-4">No clients yet</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Your First Client
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Client Name */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {client.name}
                      </h3>
                      {client.contact_email && (
                        <p className="text-sm text-slate-500 mt-1">
                          {client.contact_email}
                        </p>
                      )}
                    </div>

                    {/* Portal Token */}
                    <div className="bg-slate-50 rounded p-3">
                      <p className="text-xs text-slate-600 mb-1">
                        Portal Token:
                      </p>
                      <p className="text-xs font-mono text-slate-700 break-all">
                        {client.portal_token.substring(0, 16)}...
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Share link: /portal/{client.portal_token}
                      </p>
                    </div>

                    {/* Created Date */}
                    <p className="text-xs text-slate-500">
                      Added {new Date(client.created_at).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      
                    <a href={`/campaigns?client_id=${client.id}`}
                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-sm font-medium text-center transition-colors"
                      >
                        View Campaigns
                      </a>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
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