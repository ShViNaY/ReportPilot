// components/layouts/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  IconDashboard,
  IconClients,
  IconCampaigns,
  IconMetrics,
  IconTeam,
  IconLogout,
  IconMenu,
  IconX,
} from '@/components/common/Icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    { href: '/clients', label: 'Clients', icon: IconClients },
    { href: '/campaigns', label: 'Campaigns', icon: IconCampaigns },
    { href: '/metrics', label: 'Metrics', icon: IconMetrics },
    ...(user?.role === 'owner'
      ? [{ href: '/team', label: 'Team', icon: IconTeam }]
      : []),
  ];

  // User initials
  const initials = user?.email
    ? user.email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : 'RP';

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-black">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-200 border-r border-zinc-800/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand */}
          <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-zinc-700 transition-colors">
                <span className="w-2 h-2 rounded-full bg-lime-400 inline-block shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
              </div>
              <div>
                <span className="text-base font-bold text-zinc-100 tracking-tight leading-none block">
                  Report<span className="text-lime-400">Pilot</span>
                </span>
                <span className="text-[11px] font-medium text-zinc-500 leading-none mt-1 block">
                  Agency Workspace
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md focus:outline-none cursor-pointer"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            <p className="px-3 pb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-zinc-900 text-zinc-100 shadow-xs font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lime-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout Block */}
          <div className="p-3 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-lime-400 flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-200 truncate">
                  {user?.email || 'Loading...'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      user?.role === 'owner' ? 'bg-lime-400' : 'bg-zinc-500'
                    }`}
                  />
                  <p className="text-[10px] text-zinc-500 capitalize font-medium">
                    {user?.role === 'owner' ? 'Agency Owner' : 'Account Manager'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800 cursor-pointer"
            >
              <IconLogout className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Mobile Navbar */}
        <header className="lg:hidden bg-zinc-950 text-zinc-100 border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 inline-block" />
            </div>
            <span className="font-bold text-zinc-100 tracking-tight">
              Report<span className="text-lime-400">Pilot</span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-md focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <IconMenu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 xl:px-10 max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}