// app/features/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { PublicFooter } from '@/components/landing/PublicFooter';
import { getBreadcrumbJsonLd } from '@/lib/seo/structuredData';
import {
  IconLayoutGrid,
  IconClients,
  IconBarChart3,
  IconShield,
  IconZap,
  IconShare2,
} from '@/components/common/Icons';

export const metadata: Metadata = {
  title: 'Features | Marketing Agency Reporting Platform',
  description:
    'Discover ReportPilot features: centralized multi-client campaign tracking, tokenized live client portals, automated CPL metrics, and role-based agency team access.',
  alternates: {
    canonical: '/features',
  },
  openGraph: {
    title: 'ReportPilot Features | Marketing Reporting for Agencies',
    description:
      'Centralized multi-client dashboards, tokenized read-only client portals, and automated performance benchmarks without manual decks.',
    url: '/features',
  },
};

export default function FeaturesPage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Features', url: '/features' },
  ]);

  const featureCards = [
    {
      title: 'Unified Multi-Client Dashboard',
      description:
        'Oversee your entire agency roster from a single panoramic overview. Track ad spend, incoming leads, and completed conversions cross-client without flipping between separate platform tabs.',
      icon: IconLayoutGrid,
      tag: 'Portfolio Intelligence',
    },
    {
      title: 'Tokenized Live Client Portals',
      description:
        'Generate secure, read-only dashboard links for every client. Clients inspect their real-time performance without requiring a login or ever seeing another client’s metrics.',
      icon: IconShare2,
      tag: 'Client Experience',
    },
    {
      title: 'Automated KPI Calculation',
      description:
        'Cost Per Lead (CPL) and conversion velocity calculate automatically upon metric entry. Instant benchmark visualizations highlight which accounts are pacing efficiently.',
      icon: IconBarChart3,
      tag: 'Real-Time Analytics',
    },
    {
      title: 'Strict Agency Data Isolation',
      description:
        'Enterprise-grade multi-tenancy backed by Supabase Row-Level Security. Client tokens are scoped strictly to individual client records, guaranteeing zero cross-client leakage.',
      icon: IconShield,
      tag: 'Security First',
    },
    {
      title: 'Google & Meta Ads Alignment',
      description:
        'Normalize ad reporting across Google Ads, Meta Ads, and specialized media channels into one standardized telemetry stream your clients understand in seconds.',
      icon: IconZap,
      tag: 'Cross-Channel',
    },
    {
      title: 'Role-Based Team Collaboration',
      description:
        'Empower account managers and media buyers to manage their specific accounts with granular agency permissions while agency owners retain complete administrative oversight.',
      icon: IconClients,
      tag: 'Team Governance',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-black flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-24">
        {/* Page Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
            Agency Reporting Capabilities
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-100 leading-tight">
            Built for agencies that value <span className="text-lime-400">client clarity</span>.
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Eliminate hours of weekly reporting prep. ReportPilot equips your team with live multi-client dashboards and friction-free client portals.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-transform active:scale-95 shadow-sm"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium text-sm transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section aria-labelledby="features-grid-heading" className="space-y-8">
          <h2 id="features-grid-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 text-center">
            Everything your agency needs to report with speed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {featureCards.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-7 hover:border-lime-400/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lime-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-100">{feat.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Workflow Showcase */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-lime-400">
              Agency Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              How ReportPilot replaces manual weekly reporting
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              From onboarding a new account to delivering live metrics to your clients, the entire workflow is built for zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-3 bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800/60">
              <span className="w-7 h-7 rounded-full bg-lime-400/10 text-lime-400 text-xs font-bold flex items-center justify-center border border-lime-400/20">
                1
              </span>
              <h3 className="text-base font-bold text-zinc-100">Add Agency Clients</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Add clients to your workspace in seconds. Group campaigns by platform (Google Ads, Meta Ads) and set monthly targets.
              </p>
            </div>

            <div className="space-y-3 bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800/60">
              <span className="w-7 h-7 rounded-full bg-lime-400/10 text-lime-400 text-xs font-bold flex items-center justify-center border border-lime-400/20">
                2
              </span>
              <h3 className="text-base font-bold text-zinc-100">Log Campaign Telemetry</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your period spend, leads, and conversions. ReportPilot instantly computes CPL, conversion rates, and performance trajectories.
              </p>
            </div>

            <div className="space-y-3 bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800/60">
              <span className="w-7 h-7 rounded-full bg-lime-400/10 text-lime-400 text-xs font-bold flex items-center justify-center border border-lime-400/20">
                3
              </span>
              <h3 className="text-base font-bold text-zinc-100">Share Instant Portals</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Send each client their personal, secure portal URL. Clients bookmark the link and check live metrics whenever they want.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center space-y-6 pt-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100">
            Ready to streamline your agency reporting?
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm">
            Create an agency workspace in under 60 seconds. Free to start with full multi-client support.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-transform active:scale-95"
            >
              Start Free Today
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
