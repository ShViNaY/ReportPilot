// app/(dashboard)/clients/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { apiFetch } from '@/lib/utils/apiClient';
import { Client, TeamMember } from '@/types';
import {
  IconClients,
  IconLink,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconTrash,
  IconPlus,
  IconArrowUpRight,
} from '@/components/common/Icons';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', contact_email: '' });
  const [formError, setFormError] = useState('');

  // Portal token state map: clientId → PortalTokenState (owner only)
  const [portalState, setPortalState] = useState<Record<string, PortalTokenState>>({});

  // Pagination
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1); // reset to first page on refresh
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

  const handleCopyLink = (clientId: string, token: string) => {
    const link = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // Loading screen
  // ---------------------------------------------------------------------------

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
              <p className="text-sm font-medium text-slate-500">Loading agency clients...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Client Directory</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage accounts, assign team managers, and provision secure portal links.
              </p>
            </div>
            {isOwner && (
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white self-start sm:self-auto"
              >
                {showForm ? 'Cancel' : '+ Add Client'}
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4">
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Add New Client Account</h2>
                <span className="text-xs text-slate-400">Owner action</span>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Client Organization Name"
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Primary Contact Email (Optional)"
                  type="email"
                  placeholder="client@acmecorp.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
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
                    Save Client
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
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4 bg-white/60">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <IconClients className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">No client accounts yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Add your first client to start organizing campaigns and sharing live performance reports.
                </p>
              </div>
              {isOwner && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Create Your First Client
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Pagination indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <p>
                  Showing <span className="font-semibold text-slate-800">{Math.min((currentPage - 1) * PAGE_SIZE + 1, clients.length)}–{Math.min(currentPage * PAGE_SIZE, clients.length)}</span> of{' '}
                  <span className="font-semibold text-slate-800">{clients.length}</span> {clients.length === 1 ? 'client' : 'clients'}
                </p>
                {clients.length > PAGE_SIZE && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {Math.ceil(clients.length / PAGE_SIZE)}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(clients.length / PAGE_SIZE), p + 1))}
                      disabled={currentPage >= Math.ceil(clients.length / PAGE_SIZE)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((client) => {
                  const pt = portalState[client.id] ?? defaultPortalState();
                  return (
                    <div
                      key={client.id}
                      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Client Name & Contact */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                              {client.name}
                            </h3>
                            {client.contact_email ? (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{client.contact_email}</p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-0.5 italic">No email on file</p>
                            )}
                          </div>
                          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {client.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>

                        {/* Manager Assignment */}
                        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/60">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Assigned Manager
                          </p>
                          {isOwner ? (
                            <select
                              value={client.assigned_manager?.id || ''}
                              onChange={(e) => handleAssign(client.id, e.target.value)}
                              disabled={assigningClientId === client.id}
                              className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 disabled:opacity-50"
                            >
                              <option value="">Unassigned (Owner only)</option>
                              {managers.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.email}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs font-medium text-slate-700">
                              {client.assigned_manager?.email || 'Unassigned'}
                            </p>
                          )}
                        </div>

                        {/* Portal Link (Owner Only) */}
                        {isOwner && (
                          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <IconLink className="w-3.5 h-3.5 text-slate-500" />
                                <span>Client Portal Link</span>
                              </div>
                              {pt.loading && (
                                <span className="text-[11px] text-slate-400 animate-pulse">checking…</span>
                              )}
                              {!pt.loading && pt.hasToken && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full px-2 py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                  Active
                                </span>
                              )}
                              {!pt.loading && !pt.hasToken && (
                                <span className="text-[11px] text-slate-400">No active link</span>
                              )}
                            </div>

                            {/* Expiry info */}
                            {pt.hasToken && pt.expiresAt && (
                              <p className="text-[11px] text-slate-500">
                                Expires{' '}
                                {new Date(pt.expiresAt) < new Date() ? (
                                  <span className="text-rose-600 font-semibold">
                                    {new Date(pt.expiresAt).toLocaleDateString()} (Expired)
                                  </span>
                                ) : (
                                  <span className="font-medium text-slate-700">
                                    {new Date(pt.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </p>
                            )}
                            {pt.hasToken && !pt.expiresAt && (
                              <p className="text-[11px] text-slate-400">Permanent link (no expiry)</p>
                            )}

                            {/* One-time token copy dialog */}
                            {pt.generatedToken && (
                              <div className="mt-1 rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 space-y-2 shadow-2xs">
                                <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                                  <span>🔑 Generated Portal Link</span>
                                </p>
                                <p className="text-[11px] font-mono text-indigo-800 break-all bg-white rounded-md p-2 border border-indigo-200">
                                  {typeof window !== 'undefined'
                                    ? `${window.location.origin}/portal/${pt.generatedToken}`
                                    : `/portal/${pt.generatedToken}`}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCopyLink(client.id, pt.generatedToken!)}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                  >
                                    {copiedId === client.id ? (
                                      <>
                                        <IconCheck className="w-3.5 h-3.5" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <IconCopy className="w-3.5 h-3.5" />
                                        <span>Copy Link</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => patchPortal(client.id, { generatedToken: null })}
                                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Error */}
                            {pt.error && (
                              <p className="text-xs text-rose-600 bg-rose-50 rounded-md p-2">
                                {pt.error}
                              </p>
                            )}

                            {/* Generate / Expiry panel */}
                            {pt.showGeneratePanel && (
                              <div className="mt-1 rounded-lg border border-slate-200 bg-white p-3 space-y-2.5 shadow-xs">
                                <label className="block text-[11px] font-semibold text-slate-600">Link Expiration</label>
                                <select
                                  value={pt.expirationDays}
                                  onChange={(e) =>
                                    patchPortal(client.id, {
                                      expirationDays: e.target.value as PortalTokenState['expirationDays'],
                                    })
                                  }
                                  className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
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
                                    className="flex-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    {pt.generating ? 'Generating…' : pt.hasToken ? 'Regenerate' : 'Generate'}
                                  </button>
                                  <button
                                    onClick={() => patchPortal(client.id, { showGeneratePanel: false })}
                                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-medium transition-colors cursor-pointer"
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
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
                                >
                                  <IconRefresh className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{pt.hasToken ? 'Regenerate' : 'Generate Link'}</span>
                                </button>
                                {pt.hasToken && (
                                  <button
                                    disabled={pt.revoking}
                                    onClick={() => handleRevokeToken(client.id)}
                                    className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 rounded-md text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    {pt.revoking ? '…' : 'Revoke'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          href={`/campaigns?client_id=${client.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                        >
                          <span>Campaigns</span>
                          <IconArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Delete Client"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}