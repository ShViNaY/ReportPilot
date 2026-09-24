// app/contact/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { PublicFooter } from '@/components/landing/PublicFooter';
import { getBreadcrumbJsonLd } from '@/lib/seo/structuredData';
import { IconMail } from '@/components/common/Icons';

export const metadata: Metadata = {
  title: 'Contact | Agency Support & Product Inquiries',
  description:
    'Contact the ReportPilot team for agency onboarding questions, product demos, platform support, or feedback.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact ReportPilot | Marketing Reporting for Agencies',
    description:
      'Have questions about setting up ReportPilot for your agency? Contact our team for prompt support.',
    url: '/contact',
  },
};

export default function ContactPage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-black flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-6 py-20 sm:py-28 space-y-16">
        <section className="text-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
            Agency Support & Inquiries
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-tight">
            We’re here to help your agency <span className="text-lime-400">succeed</span>.
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Have questions about ReportPilot, need onboarding guidance, or want to discuss a custom setup for your team? Reach out to us directly.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Support Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lime-400">
                <IconMail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Direct Email Support</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Send an email directly to our support and engineering team. We typically respond within one business day.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                Support Email
              </span>
              <p className="text-base font-semibold text-lime-400 mt-1">
                support@reportpilot.com
              </p>
            </div>
          </div>

          {/* Quick Start Guidance */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lime-400 font-bold font-mono">
                ⚡
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Ready to try it right now?</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                You can create a live agency account in less than a minute. No sales call, no credit card, and immediate access to your dashboard.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-transform active:scale-95"
              >
                Create Free Workspace
              </Link>
            </div>
          </div>
        </section>

        {/* Agency FAQs summary */}
        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-4 text-center">
          <h2 className="text-lg font-bold text-zinc-100">Looking for pricing or plan details?</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Review our full breakdown of features and agency tiers on the pricing page.
          </p>
          <div className="pt-2">
            <Link
              href="/pricing"
              className="text-sm text-lime-400 hover:underline font-semibold"
            >
              Explore Pricing & FAQs →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
