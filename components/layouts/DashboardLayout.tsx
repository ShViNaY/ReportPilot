// components/layouts/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useSidebar } from '@/lib/context/SidebarContext';
import {
  IconDashboard,
  IconClients,
  IconCampaigns,
  IconMetrics,
  IconTeam,
  IconLogout,
  IconMenu,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from '@/components/common/Icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
  contentBg?: string;
}

export function DashboardLayout({ children, contentBg }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
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
        className={`fixed inset-y-0 left-0 z-50 bg-zinc-950 text-zinc-200 border-r border-zinc-800/80 transform transition-all duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          sidebarOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand Header with Collapse Toggle beside branding */}
          <div
            className={`h-16 border-b border-zinc-800/80 flex items-center transition-all duration-300 shrink-0 ${
              isCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'
            }`}
          >
            {!isCollapsed ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 min-w-0 group focus-visible:outline-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-zinc-700 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-lime-400 inline-block shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-zinc-100 tracking-tight leading-none block truncate">
                      Report<span className="text-lime-400">Pilot</span>
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 leading-none mt-1 block truncate">
                      Agency Workspace
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Desktop Collapse Toggle beside branding */}
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-lime-400 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar"
                  >
                    <IconChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Mobile close button */}
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md focus:outline-none cursor-pointer"
                    aria-label="Close menu"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              /* Collapsed State: Logo + Toggle beside branding */
              <div className="flex items-center justify-center gap-1.5">
                <Link
                  href="/dashboard"
                  className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 hover:border-zinc-700 transition-colors"
                  title="ReportPilot - Agency Workspace"
                  aria-label="ReportPilot Dashboard"
                >
                  <span className="w-2 h-2 rounded-full bg-lime-400 inline-block shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
                </Link>

                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-lime-400 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <IconChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                Navigation
              </p>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              if (isCollapsed) {
                return (
                  <div key={item.href} className="relative group flex justify-center">
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150 relative ${
                        active
                          ? 'bg-zinc-900 text-lime-400 shadow-xs border border-zinc-800'
                          : 'text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          active ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      />
                      {active && (
                        <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.7)]" />
                      )}
                    </Link>

                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#141416] border border-zinc-800 text-xs font-semibold text-zinc-100 shadow-xl shadow-black/80 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  </div>
                );
              }

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
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lime-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout Block */}
          <div
            className={`border-t border-zinc-800/80 transition-all duration-300 shrink-0 ${
              isCollapsed ? 'p-2 space-y-2 flex flex-col items-center' : 'p-3 space-y-2'
            }`}
          >
            {isCollapsed ? (
              <>
                {/* Compact User Initials with Tooltip */}
                <div className="relative group flex justify-center">
                  <div
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-lime-400 flex items-center justify-center font-mono font-semibold text-xs shrink-0 cursor-default relative"
                    aria-label={user?.email || 'User profile'}
                  >
                    {initials}
                    <span
                      className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-zinc-950 ${
                        user?.role === 'owner' ? 'bg-lime-400' : 'bg-zinc-500'
                      }`}
                    />
                  </div>

                  {/* Profile Tooltip */}
                  <div className="absolute left-full ml-3 bottom-0 px-3 py-2 rounded-xl bg-[#141416] border border-zinc-800 text-xs shadow-2xl shadow-black/90 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
                    <p className="font-semibold text-zinc-100">{user?.email || 'User'}</p>
                    <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                      {user?.role === 'owner' ? 'Agency Owner' : 'Account Manager'}
                    </p>
                  </div>
                </div>

                {/* Compact Logout Button with Tooltip */}
                <div className="relative group flex justify-center">
                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                  >
                    <IconLogout className="w-4 h-4" />
                  </button>

                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#141416] border border-zinc-800 text-xs font-semibold text-rose-400 shadow-xl shadow-black/80 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
                    Log out
                  </div>
                </div>
              </>
            ) : (
              <>
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
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800 cursor-pointer"
                >
                  <IconLogout className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } ${contentBg || 'bg-zinc-950'}`}
      >
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
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-md focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <IconMenu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto ${contentBg || 'bg-zinc-950'}`}>
          <div className="p-4 sm:p-6 lg:p-8 xl:px-10 max-w-7xl mx-auto space-y-6">
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