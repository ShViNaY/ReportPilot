'use client';

import * as React from 'react';
import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext';
import { IconEye, IconEyeOff } from '@/components/common/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Preload dashboard bundle so transition after login is instant
  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // On success, AuthContext handles redirection to /dashboard
  };

  const cardVariant = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.5,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    },
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center">
      {/* Mobile-only Wordmark */}
      <div className="lg:hidden mb-8 text-center">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#f4f4f5]">
          Report<span className="text-[#a3e635]">Pilot</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        className="w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-8 sm:p-9 shadow-sm"
      >
        {/* Card Header */}
        <div className="mb-7">
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight text-[#f4f4f5] leading-tight">
            Welcome back
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-2">
            Enter your credentials to access your agency dashboard.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Work Email Field */}
          <div className="space-y-2 text-left">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#f4f4f5]"
            >
              Work Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@agency.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className={`w-full h-12 bg-[#09090b] px-4 rounded-xl text-[#f4f4f5] placeholder-[#71717a] text-sm border transition-colors focus:outline-none ${
                error
                  ? 'border-rose-900/80 focus:border-rose-600'
                  : 'border-[#27272a] focus:border-[#a3e635]'
              }`}
            />
          </div>

          {/* Password Field with Visibility Toggle */}
          <div className="space-y-2 text-left">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#f4f4f5]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full h-12 bg-[#09090b] px-4 pr-11 rounded-xl text-[#f4f4f5] placeholder-[#71717a] text-sm border transition-colors focus:outline-none ${
                  error
                    ? 'border-rose-900/80 focus:border-rose-600'
                    : 'border-[#27272a] focus:border-[#a3e635]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#f4f4f5] p-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
              >
                {showPassword ? (
                  <IconEyeOff className="w-4 h-4" />
                ) : (
                  <IconEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-rose-950/40 border border-rose-900/60 p-3 text-xs text-rose-400 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 shrink-0 text-rose-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#a3e635] hover:bg-[#92d628] text-[#09090b] font-semibold text-sm rounded-full transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-[#09090b]"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in to Dashboard</span>
              )}
            </button>
          </div>
        </form>

        {/* Subtle Divider & Signup Link */}
        <div className="mt-7 pt-5 border-t border-[#27272a] text-center text-xs sm:text-sm text-[#a1a1aa]">
          Don&apos;t have an agency account?{' '}
          <Link
            href="/signup"
            className="text-[#a3e635] font-semibold hover:underline transition-colors ml-1 inline-block"
          >
            Create one now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}