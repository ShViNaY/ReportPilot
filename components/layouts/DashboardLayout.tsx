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
  IconLogo,
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
    <div className="flex min-h-screen bg-slate-50/70 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-200 border-r border-slate-800/80 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand */}
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <IconLogo className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform" />
              <div>
                <span className="text-base font-semibold text-white tracking-tight leading-none block">
                  ReportPilot
                </span>
                <span className="text-[11px] font-medium text-slate-400 leading-none">
                  Agency Workspace
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md focus:outline-none"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600/90 text-white shadow-xs font-semibold shadow-indigo-500/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout Block */}
          <div className="p-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">
                  {user?.email || 'Loading...'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      user?.role === 'owner' ? 'bg-purple-400' : 'bg-emerald-400'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 capitalize font-medium">
                    {user?.role === 'owner' ? 'Agency Owner' : 'Account Manager'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
            >
              <IconLogout className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navbar */}
        <header className="lg:hidden bg-slate-950 text-white border-b border-slate-800 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <IconLogo className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-white tracking-tight">ReportPilot</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-900 rounded-md focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <IconMenu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}