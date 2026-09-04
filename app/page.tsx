import Link from 'next/link';
import {
  IconLogo,
  IconDashboard,
  IconClients,
  IconMetrics,
  IconArrowUpRight,
  IconCheck,
  IconSpend,
  IconLeads,
  IconConversions,
} from '@/components/common/Icons';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <IconLogo className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-lg font-bold text-white tracking-tight">ReportPilot</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-150 shadow-sm shadow-indigo-500/20 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 max-w-6xl mx-auto text-center space-y-12">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Built for High-Velocity Marketing Agencies</span>
          <span className="text-slate-500">|</span>
          <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
            Client Portals Included
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Campaign reporting,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-200 to-purple-400">
              effortlessly streamlined.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop assembling spreadsheet reports by hand. Enter your campaign numbers once and give your clients real-time, read-only performance dashboards.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto pt-2">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Start Free Agency Trial</span>
            <IconArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-base font-medium rounded-xl border border-slate-800 transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-[0.98]"
          >
            Agency Login
          </Link>
        </div>

        {/* Feature Checkmarks */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400 pt-2">
          <div className="flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-emerald-400" />
            <span>Automatic CPL & ROI Calculation</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Passwordless Client Portals</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-emerald-400" />
            <span>One-click CSV Data Exports</span>
          </div>
        </div>

        {/* Interactive Dashboard Mockup Card */}
        <div className="w-full pt-8">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 sm:p-5 shadow-2xl backdrop-blur-xl text-left">
            {/* Window Top Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.reportpilot.com/dashboard</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                ● Live Sync
              </span>
            </div>

            {/* Dashboard Mock Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Stat Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Total Ad Spend</span>
                    <IconSpend className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-2 tabular-nums">$42,850.00</p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">↑ 14.2% vs last period</p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Qualified Leads</span>
                    <IconLeads className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-2 tabular-nums">1,420</p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">↑ 8.6% efficiency</p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Average CPL</span>
                    <IconDashboard className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-2 tabular-nums">$30.18</p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">↓ $4.20 cost reduction</p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Conversions</span>
                    <IconConversions className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-2 tabular-nums">284</p>
                  <p className="text-[11px] text-indigo-400 mt-1 font-medium">20.0% conversion rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 w-full text-left">
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <IconDashboard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Unified Multi-Client Hub</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Consolidate Google Ads, Meta Ads, and custom channels across your entire agency portfolio in one structured view.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IconClients className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Instant Client Portals</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate secure, tokenized portal links for your clients. No login headaches, zero friction, and always up to date.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <IconMetrics className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Automated KPI Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              CPL, conversion rates, and performance trends calculate instantly on ingestion with customizable date filters.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IconLogo className="w-5 h-5 rounded" />
            <span className="font-semibold text-slate-300">ReportPilot</span>
            <span>— Agency Campaign Intelligence</span>
          </div>
          <p>© {new Date().getFullYear()} ReportPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}