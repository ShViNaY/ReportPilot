// app/(auth)/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { IconLogo } from '@/components/common/Icons';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // on success, AuthContext handles the redirect
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
          Welcome back
        </h2>
        <p className="text-xs text-slate-500">
          Enter your credentials to access your agency dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@agency.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

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
          Sign in to Dashboard
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
        Don&apos;t have an agency account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}