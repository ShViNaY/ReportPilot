// app/(dashboard)/team/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Icons } from '@/components/common/Icons';
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

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to remove team member');
        return;
      }

      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      setError('Failed to remove team member');
      console.error(err);
    }
  };

  // Only show to owners
  if (!user || user.role !== 'owner') {
    return (
      <ProtectedRoute requiredRole="owner">
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 ring-1 ring-amber-200">
              <Icons.X className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Access Restricted</h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
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
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">Loading team members...</p>
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Management</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Manage your agency team members, credentials, and client assignment capabilities.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
              variant={showForm ? 'outline' : 'primary'}
            >
              {showForm ? (
                <>
                  <Icons.X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Icons.Plus className="w-4 h-4" />
                  Add Team Member
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200/80 p-4 text-sm text-red-700 flex items-start gap-3 shadow-xs">
              <Icons.X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Add Member Form Drawer / Panel */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-500/5 p-6 sm:p-7 relative overflow-hidden transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Invite New Team Member
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Account Managers will have access to assigned clients and reporting capabilities.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 max-w-xl">
                <Input
                  label="Member Email Address"
                  type="email"
                  placeholder="manager@agency.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />

                <Input
                  label="Temporary Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />

                <div className="flex items-start gap-3 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 text-xs text-indigo-900 leading-relaxed">
                  <Icons.Team className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    New members are automatically assigned the <strong>Account Manager</strong> role with permissions to enter ad metrics and manage assigned client workspaces.
                  </span>
                </div>

                {formError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 font-medium">
                    {formError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="shadow-sm"
                  >
                    Create Account
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Team Members List */}
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Icons.Team className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No team members added</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
                Scale your agency by inviting account managers to oversee client accounts and enter performance data.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2"
              >
                <Icons.Plus className="w-4 h-4" />
                Add First Team Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {members.map(member => {
                const isOwner = member.role === 'owner';
                const initials = member.email.substring(0, 2).toUpperCase();
                const isCurrentUser = user.id === member.id;

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isOwner
                          ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {member.email}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 mt-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isOwner
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                : 'bg-sky-50 text-sky-700 border border-sky-200/60'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOwner ? 'bg-indigo-600' : 'bg-sky-600'}`} />
                            {isOwner ? 'Agency Owner' : 'Account Manager'}
                          </span>

                          {member.assigned_client_count !== undefined && !isOwner && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              <Icons.Clients className="w-3.5 h-3.5 text-slate-400" />
                              {member.assigned_client_count} {member.assigned_client_count === 1 ? 'client' : 'clients'} assigned
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Icons.Calendar className="w-3.5 h-3.5 text-slate-300" />
                            Added {new Date(member.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isOwner ? (
                        <span className="text-xs text-slate-400 font-medium px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          Primary Admin
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleRemoveMember(member.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 text-xs"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Role Explainer Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Icons.Team className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-white">Agency Role Architecture</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-1.5">
                <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Agency Owner
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Full administrative control. Can create/delete clients, manage team accounts, edit any campaign, and view all agency analytics.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-1.5">
                <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Account Manager
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Operational access. Can create and edit campaigns and input daily ad metrics strictly for their assigned clients.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-1.5">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Client Guest
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Zero friction. Accesses live, read-only performance dashboards securely via tokenized shareable portal links without passwords.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}