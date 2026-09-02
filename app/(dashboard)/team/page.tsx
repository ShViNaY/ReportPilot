// app/(dashboard)/team/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
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
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
              <p className="text-slate-500 mt-2">
                Only agency owners can manage the team.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="owner">
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
              <p className="text-slate-600 mt-4">Loading team members...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="owner">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Team Management</h1>
              <p className="text-slate-500 mt-1">
                Manage your agency team members and their permissions.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {showForm ? 'Cancel' : '+ Add Team Member'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Add Member Form */}
          {showForm && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Add Team Member
              </h2>

              <form onSubmit={handleAddMember} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="manager@yourcompany.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />

                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                  💡 New members are added as Account Managers. They can manage clients and enter metrics.
                </p>

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
                    Add Member
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

          {/* Team Members List */}
          {members.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-600 mb-4">No team members yet</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Add Your First Team Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map(member => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 flex items-start justify-between hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {member.email}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              member.role === 'owner'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {member.role === 'owner' ? 'Agency Owner' : 'Account Manager'}
                          </span>
                          {member.assigned_client_count !== undefined && (
                            <span className="text-sm text-slate-600">
                              📊 {member.assigned_client_count} clients assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3">
                      Added {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {member.role === 'owner' ? (
                      <span className="text-xs text-slate-500 px-3 py-2">
                        (You)
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Team Roles</h3>
            <div className="space-y-2 text-sm text-blue-800">
                <p>
                    <strong>Owner:</strong> Full access, can manage all clients, campaigns, and team members
                </p>
                <p>
                    <strong>Account Manager:</strong> Can manage assigned clients and enter metrics
                </p>
                <p>
                    <strong>Client:</strong> No account needed — views their own campaigns and metrics through a private, read-only shareable link
                </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}