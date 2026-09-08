// app/(dashboard)/team/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Icons } from '@/components/common/Icons';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { apiFetch } from '@/lib/utils/apiClient';
import { TeamMember } from '@/types';

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  // Fetch team members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/team');
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to load team members');
        return;
      }

      setMembers(data.members || []);
    } catch (err) {
      setError('Something went wrong');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!formData.password.trim()) {
      setFormError('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiFetch('/api/team', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || 'Failed to add team member');
        return;
      }

      // Reset form and refresh list
      setFormData({ email: '', password: '' });
      setShowForm(false);
      await fetchMembers();
    } catch (err) {
      setFormError('Something went wrong');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this team member? They will immediately lose all access to this agency workspace.',
      confirmText: 'Remove Member',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await apiFetch(`/api/team/${memberId}`, {
            method: 'DELETE',
          });

          const data = await res.json();

          if (!data.success) {
            setError(data.error || 'Failed to remove team member');
            return;
          }

          setMembers(members.filter((m) => m.id !== memberId));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError('Failed to remove team member');
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Only show to owners
  if (!user || user.role !== 'owner') {
    return (
      <ProtectedRoute requiredRole="owner">
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 flex items-center justify-center mb-4 border border-zinc-800">
              <Icons.X className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Access Restricted</h1>
            <p className="text-sm text-zinc-500 mt-1.5 max-w-sm">
              Only agency owners have permissions to manage team members and their account roles.
            </p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="owner">
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-lime-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-zinc-500">Loading team members...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="owner">
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Team Management</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Manage your agency team members, credentials, and client assignment capabilities.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer self-start sm:self-auto"
            >
              {showForm ? (
                <>
                  <Icons.X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Icons.Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Team Member</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-4 text-xs sm:text-sm text-rose-400 flex items-start gap-3">
              <Icons.X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-300">Error</p>
                <p className="mt-0.5 text-rose-400">{error}</p>
              </div>
            </div>
          )}

          {/* Add Member Form Drawer / Panel */}
          {showForm && (
            <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Invite New Team Member
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Account Managers will have access to assigned clients and reporting capabilities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Member Email Address <span className="text-lime-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="manager@agency.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Temporary Password <span className="text-lime-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 transition-colors"
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-xs text-zinc-400 leading-relaxed">
                  <Icons.Team className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                  <span>
                    New members are automatically assigned the <strong className="text-zinc-200 font-semibold">Account Manager</strong> role with permissions to enter ad metrics and manage assigned client workspaces.
                  </span>
                </div>

                {formError && (
                  <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 font-medium">
                    {formError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold transition-all active:scale-98 disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
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

          {/* Team Members List */}
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800/90 bg-[#111113]/50 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400 flex items-center justify-center mx-auto mb-3">
                <Icons.Team className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">No team members added</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-5">
                Scale your agency by inviting account managers to oversee client accounts and enter performance data.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Icons.Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add First Team Member</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {members.map((member) => {
                const isOwner = member.role === 'owner';
                const initials = member.email.substring(0, 2).toUpperCase();
                const isCurrentUser = user.id === member.id;

                return (
                  <div
                    key={member.id}
                    className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-all duration-200 shadow-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold font-mono text-xs shrink-0 border ${
                          isOwner
                            ? 'bg-zinc-900 border-zinc-800 text-lime-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-100 truncate">
                            {member.email}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-[10px] font-semibold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-md border border-lime-400/20 font-mono">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 mt-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isOwner
                                ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                                : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOwner ? 'bg-lime-400' : 'bg-zinc-500'
                              }`}
                            />
                            {isOwner ? 'Agency Owner' : 'Account Manager'}
                          </span>

                          {member.assigned_client_count !== undefined && !isOwner && (
                            <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium bg-zinc-950 px-2.5 py-0.5 rounded-md border border-zinc-800">
                              <Icons.Clients className="w-3.5 h-3.5 text-zinc-500" />
                              {member.assigned_client_count}{' '}
                              {member.assigned_client_count === 1 ? 'client' : 'clients'} assigned
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <Icons.Calendar className="w-3.5 h-3.5 text-zinc-600" />
                            Added {new Date(member.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isOwner ? (
                        <span className="text-xs text-zinc-500 font-medium px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                          Primary Admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/60 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                          title="Remove Team Member"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Role Explainer Card */}
          <div className="bg-[#111113] rounded-2xl border border-zinc-800/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-lime-400 flex items-center justify-center">
                <Icons.Team className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-zinc-100">Agency Role Architecture</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-950/60 border border-zinc-800/70 rounded-xl p-4 space-y-1.5">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                  <span>Agency Owner</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Full administrative control. Can create/delete clients, manage team accounts, edit any campaign, and view all agency analytics.
                </p>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/70 rounded-xl p-4 space-y-1.5">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>Account Manager</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Operational access. Can create and edit campaigns and input daily ad metrics strictly for their assigned clients.
                </p>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/70 rounded-xl p-4 space-y-1.5">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Client Guest</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Zero friction. Accesses live, read-only performance dashboards securely via tokenized shareable portal links without passwords.
                </p>
              </div>
            </div>
          </div>
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