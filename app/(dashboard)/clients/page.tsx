// app/(dashboard)/clients/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { apiFetch } from '@/lib/utils/apiClient';
import { Client, TeamMember } from '@/types';
import {
  IconClients,
  IconLink,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconTrash,
  IconArrowUpRight,
  IconPlus,
} from '@/components/common/Icons';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { getPortalUrl } from '@/lib/utils/url';

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
  generatedUrl?: string | null;
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
    generatedUrl: null,
    generating: false,
    revoking: false,
    showGeneratePanel: false,
    expirationDays: '30',
    error: '',
  };
}

function DarkSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
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
  const displayLabel = selected?.label || options[0]?.label || '';

  return (
    <div ref={ref} className={`relative ${open ? 'z-30' : ''} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-xs font-medium transition-all shadow-2xs ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-900/60 border-zinc-800 text-zinc-500'
            : open
            ? 'border-zinc-700 bg-zinc-900 text-zinc-100 ring-1 ring-zinc-700/50 cursor-pointer'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-zinc-100 cursor-pointer'
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-zinc-200' : ''
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
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-56 overflow-y-auto bg-[#141416] border border-zinc-800 rounded-xl p-1 shadow-2xl shadow-black/90 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
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
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  isSelected
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
      const loadedClients: ClientWithAssignment[] = data.clients || [];
      setClients(loadedClients);

      // Initialize portal state immediately from enriched response (eliminates N+1 HTTP loop)
      if (isOwner && loadedClients.length > 0) {
        const initialPortalState: Record<string, PortalTokenState> = {};
        loadedClients.forEach((c) => {
          if (c.portal_token) {
            initialPortalState[c.id] = {
              ...defaultPortalState(),
              hasToken: c.portal_token.has_token,
              expiresAt: c.portal_token.expires_at,
            };
          }
        });
        setPortalState((prev) => ({ ...initialPortalState, ...prev }));
      }

      setCurrentPage(1); // reset to first page on refresh
    } catch (err) {
      setError('Something went wrong');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isOwner]);

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

  const handleDelete = (clientId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Client Account',
      message: 'Are you sure? This will delete all campaigns and metrics for this client. This action cannot be undone.',
      confirmText: 'Delete Client',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await apiFetch(`/api/clients/${clientId}`, { method: 'DELETE' });
          const data = await res.json();
          if (!data.success) {
            setError(data.error || 'Failed to delete client');
            return;
          }
          setClients((prev) => prev.filter((c) => c.id !== clientId));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError('Failed to delete client');
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
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
        generatedUrl: data.portal_url,
      });
    } catch {
      patchPortal(clientId, { generating: false, error: 'Failed to generate token' });
    }
  };

  const handleRevokeToken = (clientId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Portal Link',
      message: 'Revoke the portal link? The client will immediately lose access to their live performance report.',
      confirmText: 'Revoke Link',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
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
            generatedUrl: null,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch {
          patchPortal(clientId, { revoking: false, error: 'Failed to revoke token' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleCopyLink = (clientId: string, token: string, url?: string) => {
    const link = url || getPortalUrl(token);
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopiedId(clientId);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {});
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
              <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-lime-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-zinc-500">Loading agency clients...</p>
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
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Client Directory</h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Manage accounts, assign team managers, and provision secure portal links.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer self-start sm:self-auto"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{showForm ? 'Cancel' : 'Add Client'}</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-4">
              <p className="text-xs sm:text-sm text-rose-400 font-medium">{error}</p>
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-100">Add New Client Account</h2>
                <span className="text-xs text-zinc-500 font-mono">Owner action</span>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Client Organization Name <span className="text-lime-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Primary Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="client@acmecorp.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                  />
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
                    {isSubmitting ? 'Saving...' : 'Save Client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Clients List */}
          {clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800/90 p-12 text-center space-y-4 bg-[#111113]/50">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400 flex items-center justify-center mx-auto">
                <IconClients className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-200">No client accounts yet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Add your first client to start organizing campaigns and sharing live performance reports.
                </p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  Create Your First Client
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Client Count / Pagination Bar */}
              <div className="flex items-center justify-between text-xs text-zinc-500 bg-[#111113] px-4 py-3 rounded-2xl border border-zinc-800/80">
                <p>
                  Showing{' '}
                  <span className="font-semibold text-zinc-200">
                    {Math.min((currentPage - 1) * PAGE_SIZE + 1, clients.length)}–
                    {Math.min(currentPage * PAGE_SIZE, clients.length)}
                  </span>{' '}
                  of <span className="font-semibold text-zinc-200">{clients.length}</span>{' '}
                  {clients.length === 1 ? 'client' : 'clients'}
                </p>
                {clients.length > PAGE_SIZE && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 text-xs border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {Math.ceil(clients.length / PAGE_SIZE)}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(clients.length / PAGE_SIZE), p + 1))}
                      disabled={currentPage >= Math.ceil(clients.length / PAGE_SIZE)}
                      className="px-2.5 py-1 text-xs border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Client Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((client) => {
                  const pt = portalState[client.id] ?? defaultPortalState();
                  return (
                    <div
                      key={client.id}
                      className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 sm:p-6 hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between h-full"
                    >
                      {/* Top Content */}
                      <div className="space-y-4 flex-1">
                        {/* Client Header: Name, Contact & Initials */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-zinc-100 tracking-tight truncate">
                              {client.name}
                            </h3>
                            {client.contact_email ? (
                              <p className="text-xs text-zinc-500 mt-0.5 truncate">{client.contact_email}</p>
                            ) : (
                              <p className="text-xs text-zinc-600 mt-0.5 italic">No email on file</p>
                            )}
                          </div>
                          <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-lime-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {client.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>

                        {/* Assigned Manager Section */}
                        <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/70">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Assigned Manager
                          </p>
                          {isOwner ? (
                            <DarkSelect
                              value={client.assigned_manager?.id || ''}
                              onChange={(val) => handleAssign(client.id, val)}
                              disabled={assigningClientId === client.id}
                              options={[
                                { value: '', label: 'Unassigned (Owner only)' },
                                ...managers.map((m) => ({
                                  value: m.id,
                                  label: m.email,
                                })),
                              ]}
                            />
                          ) : (
                            <p className="text-xs font-medium text-zinc-300 py-1">
                              {client.assigned_manager?.email || 'Unassigned'}
                            </p>
                          )}
                        </div>

                        {/* Client Portal Link Section (Owner Only) */}
                        {isOwner && (
                          <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/70 space-y-2.5">
                            {/* Title & Status Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                                <IconLink className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Client Portal Link</span>
                              </div>
                              {pt.loading && (
                                <span className="text-[11px] text-zinc-500 font-medium animate-pulse">checking…</span>
                              )}
                              {!pt.loading && pt.hasToken && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-lime-400 bg-lime-400/10 border border-lime-400/20 rounded-full px-2.5 py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 inline-block" />
                                  Active
                                </span>
                              )}
                              {!pt.loading && !pt.hasToken && (
                                <span className="text-[11px] text-zinc-500 font-medium">No active link</span>
                              )}
                            </div>

                            {/* Expiry info */}
                            {pt.hasToken && pt.expiresAt && (
                              <p className="text-[11px] text-zinc-500">
                                Expires{' '}
                                {new Date(pt.expiresAt) < new Date() ? (
                                  <span className="text-rose-400 font-semibold">
                                    {new Date(pt.expiresAt).toLocaleDateString()} (Expired)
                                  </span>
                                ) : (
                                  <span className="font-medium text-zinc-300">
                                    {new Date(pt.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </p>
                            )}
                            {pt.hasToken && !pt.expiresAt && (
                              <p className="text-[11px] text-zinc-500">Permanent link (no expiry)</p>
                            )}

                            {/* One-time token copy dialog */}
                            {pt.generatedToken && (
                              <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 space-y-2.5">
                                <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                                  <span>🔗 Generated Portal Link</span>
                                </p>
                                <p className="text-[11px] font-mono text-zinc-300 break-all select-all leading-relaxed bg-zinc-950 rounded-lg p-2.5 border border-zinc-800">
                                  {pt.generatedUrl || getPortalUrl(pt.generatedToken)}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(client.id, pt.generatedToken!, pt.generatedUrl || undefined)}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-lime-400 hover:bg-lime-300 text-black rounded-lg text-xs font-semibold transition-all active:scale-98 cursor-pointer shadow-xs"
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
                                    type="button"
                                    onClick={() => patchPortal(client.id, { generatedToken: null, generatedUrl: null })}
                                    className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Error */}
                            {pt.error && (
                              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg p-2.5">
                                {pt.error}
                              </p>
                            )}

                            {/* Generate / Expiry panel */}
                            {pt.showGeneratePanel && (
                              <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 space-y-3">
                                <label className="block text-[11px] font-semibold text-zinc-400">Link Expiration</label>
                                <DarkSelect
                                  value={pt.expirationDays}
                                  onChange={(val) =>
                                    patchPortal(client.id, {
                                      expirationDays: val as PortalTokenState['expirationDays'],
                                    })
                                  }
                                  options={[
                                    { value: '', label: 'No expiration (Permanent)' },
                                    { value: '7', label: '7 days' },
                                    { value: '30', label: '30 days' },
                                    { value: '90', label: '90 days' },
                                  ]}
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={pt.generating}
                                    onClick={() => handleGenerateToken(client.id)}
                                    className="flex-1 px-3 py-1.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                  >
                                    {pt.generating ? 'Generating…' : pt.hasToken ? 'Regenerate' : 'Generate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => patchPortal(client.id, { showGeneratePanel: false })}
                                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            {!pt.showGeneratePanel && !pt.generatedToken && (
                              <div className="flex gap-2 pt-1">
                                {pt.hasToken ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => patchPortal(client.id, { showGeneratePanel: true, error: '' })}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200 font-medium rounded-xl text-xs transition-all cursor-pointer focus:outline-none"
                                    >
                                      <IconRefresh className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>Regenerate</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={pt.revoking}
                                      onClick={() => handleRevokeToken(client.id)}
                                      className="inline-flex items-center justify-center px-3.5 py-2 bg-zinc-900 border border-rose-900/60 hover:border-rose-800 hover:bg-rose-950/40 text-rose-400 font-medium rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      {pt.revoking ? '…' : 'Revoke'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => patchPortal(client.id, { showGeneratePanel: true, error: '' })}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200 font-medium rounded-xl text-xs transition-all cursor-pointer focus:outline-none"
                                  >
                                    <IconRefresh className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>Generate Link</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions (Anchored at the bottom) */}
                      <div className="pt-4 mt-auto border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                        <Link
                          href={`/campaigns?client_id=${client.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-zinc-100 text-xs font-medium transition-all active:scale-[0.99] cursor-pointer"
                        >
                          <span>Campaigns</span>
                          <IconArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                        </Link>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
                            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-xl transition-colors border border-transparent hover:border-zinc-800 cursor-pointer"
                            title="Delete Client"
                            aria-label="Delete Client"
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