// app/(dashboard)/clients/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { apiFetch } from '@/lib/utils/apiClient';
import { Client, TeamMember } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientWithAssignment = Client & {
  assigned_manager: { id: string; email: string } | null;
};

/** Per-client portal token UI state (owner only) */
type PortalTokenState = {
  loading: boolean;
  hasToken: boolean;
  expiresAt: string | null;
  /** The raw token is held here only until the user dismisses the copy dialog */
  generatedToken: string | null;
  generating: boolean;
  revoking: boolean;
  showGeneratePanel: boolean;
  expirationDays: '' | '7' | '30' | '90';
  error: string;
};

function defaultPortalState(): PortalTokenState {
  return {
    loading: false,
    hasToken: false,
    expiresAt: null,
    generatedToken: null,
    generating: false,
    revoking: false,
    showGeneratePanel: false,
    expirationDays: '30',
    error: '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClientsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [clients, setClients] = useState<ClientWithAssignment[]>([]);
  const [managers, setManagers] = useState<TeamMember[]>([]);
  const [assigningClientId, setAssigningClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: '', contact_email: '' });
  const [formError, setFormError] = useState('');

  // Portal token state map: clientId → PortalTokenState (owner only)
  const [portalState, setPortalState] = useState<Record<string, PortalTokenState>>({});

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const patchPortal = useCallback((clientId: string, patch: Partial<PortalTokenState>) => {
    setPortalState((prev) => ({
      ...prev,
      [clientId]: { ...(prev[clientId] ?? defaultPortalState()), ...patch },
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchClients = useCallback(async () => {
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
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/team');
      const data = await res.json();
      if (data.success) {
        setManagers((data.members || []).filter((m: TeamMember) => m.role === 'account_manager'));
      }
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  }, []);

  /** Fetch token status (has_token + expires_at) for a single client */
  const fetchTokenStatus = useCallback(
    async (clientId: string) => {
      patchPortal(clientId, { loading: true, error: '' });
      try {
        const res = await apiFetch(`/api/clients/${clientId}/portal-token`);
        const data = await res.json();
        if (data.success) {
          patchPortal(clientId, {
            loading: false,
            hasToken: data.has_token,
            expiresAt: data.expires_at,
          });
        } else {
          patchPortal(clientId, { loading: false, error: data.error || 'Failed to load token status' });
        }
      } catch {
        patchPortal(clientId, { loading: false, error: 'Failed to load token status' });
      }
    },
    [patchPortal]
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchClients();
    if (isOwner) fetchManagers();
  }, [fetchClients, fetchManagers, isOwner]);

  // Once clients are loaded, fetch token status for all of them (owner only)
  useEffect(() => {
    if (!isOwner || clients.length === 0) return;
    clients.forEach((c) => fetchTokenStatus(c.id));
  }, [isOwner, clients, fetchTokenStatus]);

  // ---------------------------------------------------------------------------
  // Handlers — assignments
  // ---------------------------------------------------------------------------

  const handleAssign = async (clientId: string, managerId: string) => {
    setAssigningClientId(clientId);
    try {
      if (managerId === '') {
        const client = clients.find((c) => c.id === clientId);
        if (client?.assigned_manager) {
          await apiFetch(
            `/api/team/${client.assigned_manager.id}/assignments?client_id=${clientId}`,
            { method: 'DELETE' }
          );
        }
      } else {
        await apiFetch(`/api/team/${managerId}/assignments`, {
          method: 'POST',
          body: JSON.stringify({ client_id: clientId }),
        });
      }
      await fetchClients();
    } catch (err) {
      setError('Failed to update assignment');
      console.error(err);
    } finally {
      setAssigningClientId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers — client form
  // ---------------------------------------------------------------------------

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
    if (!confirm('Are you sure? This will delete all campaigns and metrics for this client.')) return;
    try {
      const res = await apiFetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to delete client');
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch (err) {
      setError('Failed to delete client');
      console.error(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers — portal token
  // ---------------------------------------------------------------------------

  const handleGenerateToken = async (clientId: string) => {
    const state = portalState[clientId] ?? defaultPortalState();
    patchPortal(clientId, { generating: true, error: '' });
    try {
      const expirationDays =
        state.expirationDays === '' ? null : parseInt(state.expirationDays, 10);
      const res = await apiFetch(`/api/clients/${clientId}/portal-token`, {
        method: 'POST',
        body: JSON.stringify({ expirationDays }),
      });
      const data = await res.json();
      if (!data.success) {
        patchPortal(clientId, { generating: false, error: data.error || 'Failed to generate token' });
        return;
      }
      patchPortal(clientId, {
        generating: false,
        showGeneratePanel: false,
        hasToken: true,
        expiresAt: data.expires_at,
        // Store the raw token just long enough for the user to copy it
        generatedToken: data.portal_token,
      });
    } catch {
      patchPortal(clientId, { generating: false, error: 'Failed to generate token' });
    }
  };

  const handleRevokeToken = async (clientId: string) => {
    if (!confirm('Revoke the portal link? The client will immediately lose access.')) return;
    patchPortal(clientId, { revoking: true, error: '' });
    try {
      const res = await apiFetch(`/api/clients/${clientId}/portal-token`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        patchPortal(clientId, { revoking: false, error: data.error || 'Failed to revoke token' });
        return;
      }
      patchPortal(clientId, {
        revoking: false,
        hasToken: false,
        expiresAt: null,
        generatedToken: null,
      });
    } catch {
      patchPortal(clientId, { revoking: false, error: 'Failed to revoke token' });
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // Loading screen
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
            {isOwner && (
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {showForm ? 'Cancel' : '+ Add Client'}
              </Button>
            )}
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Client</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Client Name"
                  type="text"
                  placeholder="ABC Furniture"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Contact Email (Optional)"
                  type="email"
                  placeholder="owner@abcfurniture.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Create Client
                  </Button>
                  <Button type="button" onClick={() => setShowForm(false)} variant="secondary">
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
              {isOwner && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Create Your First Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => {
                const pt = portalState[client.id] ?? defaultPortalState();
                return (
                  <div
                    key={client.id}
                    className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="space-y-3">
                      {/* Client Name */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
                        {client.contact_email && (
                          <p className="text-sm text-slate-500 mt-1">{client.contact_email}</p>
                        )}
                      </div>

                      {/* Assignment */}
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-xs text-slate-600 mb-1.5">Assigned to:</p>
                        {isOwner ? (
                          <select
                            value={client.assigned_manager?.id || ''}
                            onChange={(e) => handleAssign(client.id, e.target.value)}
                            disabled={assigningClientId === client.id}
                            className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white disabled:opacity-50"
                          >
                            <option value="">Unassigned</option>
                            {managers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.email}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm text-slate-700">
                            {client.assigned_manager?.email || 'Unassigned'}
                          </p>
                        )}
                      </div>

                      {/* ----------------------------------------------------------------
                          Portal Link — owner only
                      ---------------------------------------------------------------- */}
                      {isOwner && (
                        <div className="bg-slate-50 rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-700">Portal Link</p>
                            {pt.loading && (
                              <span className="text-xs text-slate-400">checking…</span>
                            )}
                            {!pt.loading && pt.hasToken && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Active
                              </span>
                            )}
                            {!pt.loading && !pt.hasToken && (
                              <span className="text-xs text-slate-400">No active link</span>
                            )}
                          </div>

                          {/* Expiry info */}
                          {pt.hasToken && pt.expiresAt && (
                            <p className="text-xs text-slate-500">
                              Expires{' '}
                              {new Date(pt.expiresAt) < new Date() ? (
                                <span className="text-red-600 font-medium">
                                  {new Date(pt.expiresAt).toLocaleDateString()}
                                </span>
                              ) : (
                                new Date(pt.expiresAt).toLocaleDateString()
                              )}
                            </p>
                          )}
                          {pt.hasToken && !pt.expiresAt && (
                            <p className="text-xs text-slate-400">No expiration</p>
                          )}

                          {/* One-time token copy dialog */}
                          {pt.generatedToken && (
                            <div className="mt-1 rounded border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                              <p className="text-xs font-semibold text-indigo-800">
                                🔑 Copy this link now — it won&apos;t be shown again
                              </p>
                              <p className="text-xs font-mono text-indigo-700 break-all bg-white rounded px-2 py-1 border border-indigo-200">
                                {typeof window !== 'undefined'
                                  ? `${window.location.origin}/portal/${pt.generatedToken}`
                                  : `/portal/${pt.generatedToken}`}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCopyLink(pt.generatedToken!)}
                                  className="flex-1 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-xs font-medium transition-colors"
                                >
                                  📋 Copy Link
                                </button>
                                <button
                                  onClick={() => patchPortal(client.id, { generatedToken: null })}
                                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-medium transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Error */}
                          {pt.error && (
                            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                              {pt.error}
                            </p>
                          )}

                          {/* Generate / expiry picker panel */}
                          {pt.showGeneratePanel && (
                            <div className="mt-1 rounded border border-slate-200 bg-white p-3 space-y-2">
                              <label className="block text-xs text-slate-600">Link expiration</label>
                              <select
                                value={pt.expirationDays}
                                onChange={(e) =>
                                  patchPortal(client.id, {
                                    expirationDays: e.target.value as PortalTokenState['expirationDays'],
                                  })
                                }
                                className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                              >
                                <option value="">No expiration</option>
                                <option value="7">7 days</option>
                                <option value="30">30 days</option>
                                <option value="90">90 days</option>
                              </select>
                              <div className="flex gap-2">
                                <button
                                  disabled={pt.generating}
                                  onClick={() => handleGenerateToken(client.id)}
                                  className="flex-1 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 rounded text-xs font-medium transition-colors"
                                >
                                  {pt.generating ? 'Generating…' : (pt.hasToken ? 'Regenerate' : 'Generate')}
                                </button>
                                <button
                                  onClick={() => patchPortal(client.id, { showGeneratePanel: false })}
                                  className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          {!pt.showGeneratePanel && !pt.generatedToken && (
                            <div className="flex gap-2 pt-0.5">
                              <button
                                disabled={pt.loading}
                                onClick={() => patchPortal(client.id, { showGeneratePanel: true, error: '' })}
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded text-xs font-medium transition-colors"
                              >
                                {pt.hasToken ? '🔄 Regenerate' : '🔗 Generate Link'}
                              </button>
                              {pt.hasToken && (
                                <button
                                  disabled={pt.revoking}
                                  onClick={() => handleRevokeToken(client.id)}
                                  className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded text-xs font-medium transition-colors"
                                >
                                  {pt.revoking ? '…' : 'Revoke'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Created Date */}
                      <p className="text-xs text-slate-500">
                        Added {new Date(client.created_at).toLocaleDateString()}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <a
                          href={`/campaigns?client_id=${client.id}`}
                          className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-sm font-medium text-center transition-colors"
                        >
                          View Campaigns
                        </a>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                          >
                            Delete
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