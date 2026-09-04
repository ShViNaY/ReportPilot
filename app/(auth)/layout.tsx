// app/(auth)/layout.tsx
import Link from 'next/link';
import { IconLogo, IconCheck } from '@/components/common/Icons';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-950 px-12 py-12 text-white relative overflow-hidden border-r border-slate-900">
        {/* Subtle ambient glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <IconLogo className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold text-white tracking-tight">ReportPilot</span>
          </Link>
        </div>

        <div className="max-w-md space-y-8 relative z-10">
          <TrendGraphic />
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              One dashboard for every client, always up to date.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter your campaign numbers once. Your team and your clients see the results instantly — no more building manual PDF decks.
            </p>
          </div>

          {/* Value points */}
          <div className="space-y-2.5 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-client management for marketing teams</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-emerald-400" />
              <span>Automated CPL, ROI, and conversion benchmarks</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-emerald-400" />
              <span>Dedicated read-only client share links</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} ReportPilot. All rights reserved.</p>
          <span className="text-slate-600">v1.0 Production</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function TrendGraphic() {
  return (
    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 max-w-xs shadow-inner">
      <div className="flex items-center justify-between mb-3 text-[11px] text-slate-400 font-medium">
        <span>Campaign Conversion Velocity</span>
        <span className="text-emerald-400 font-semibold">+28.4%</span>
      </div>
      <svg
        width="100%"
        height="50"
        viewBox="0 0 180 50"
        fill="none"
        className="text-indigo-400"
      >
        <path
          d="M2 42 L34 32 L62 38 L94 18 L126 22 L150 6 L178 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[2, 34, 62, 94, 126, 150, 178].map((cx, i) => (
          <circle
            key={i}
            cx={cx}
            cy={[42, 32, 38, 18, 22, 6, 10][i]}
            r="3"
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  );
}