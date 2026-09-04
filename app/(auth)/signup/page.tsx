// app/(auth)/signup/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { IconLogo } from '@/components/common/Icons';

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password, agencyName);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile-only branding */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-2">
        <IconLogo className="w-8 h-8 rounded-lg" />
        <span className="text-xl font-bold text-slate-900 tracking-tight">ReportPilot</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create agency account
        </h2>
        <p className="text-xs text-slate-500">
          Start reporting campaigns and sharing client portals today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Agency Name"
          type="text"
          name="agency_name"
          placeholder="BrightWave Marketing"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          required
        />

        <Input
          label="Work Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="owner@brightwave.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-[11px] text-slate-400 leading-tight">
            Must contain 8+ characters with uppercase, lowercase, number, and symbol.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0 text-rose-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 shadow-sm shadow-indigo-600/20"
        >
          Create Agency Workspace
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}