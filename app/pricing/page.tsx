// app/pricing/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { PublicFooter } from '@/components/landing/PublicFooter';
import { getBreadcrumbJsonLd, getFaqJsonLd } from '@/lib/seo/structuredData';
import { IconCheck } from '@/components/common/Icons';

export const metadata: Metadata = {
  title: 'Pricing | Transparent Plans for Marketing Agencies',
  description:
    'Transparent pricing for marketing agencies. Start free with up to 3 clients and live client portals. Scale as your agency expands.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'ReportPilot Pricing | Plans for Marketing Agencies',
    description:
      'Start free with no credit card required. Streamline multi-client reporting and share live portals.',
    url: '/pricing',
  },
};

const faqs = [
  {
    question: 'Is a credit card required to start?',
    answer:
      'No. You can create an agency workspace, add your first clients, and generate live client portal links without entering any payment details.',
  },
  {
    question: 'Do my clients need to create an account?',
    answer:
      'No. ReportPilot generates tokenized, secure read-only links for each client. Clients access their live performance dashboard directly with zero login friction.',
  },
  {
    question: 'Can clients see other clients’ metrics?',
    answer:
      'Never. Each client portal is strictly scoped to that individual client’s data through cryptographic tokens and database Row-Level Security.',
  },
  {
    question: 'What ad platforms are supported?',
    answer:
      'ReportPilot supports Google Ads, Meta Ads (Facebook & Instagram), and custom media channels. Metrics normalize automatically into standardized CPL, spend, and conversion telemetry.',
  },
  {
    question: 'Can I invite agency team members?',
    answer:
      'Yes. Agency owners can invite account managers and teammates with granular role-based permissions to manage specific client portfolios.',
  },
];

export default function PricingPage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' },
  ]);

  const faqJsonLd = getFaqJsonLd(faqs);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-black flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-24">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-100 leading-tight">
            Predictable pricing for <span className="text-lime-400">growing agencies</span>.
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Start reporting today with no credit card required. Upgrade when you need higher client volume and priority team collaboration.
          </p>
        </section>

        {/* Pricing Cards */}
        <section aria-labelledby="pricing-tiers-heading" className="max-w-4xl mx-auto">
          <h2 id="pricing-tiers-heading" className="sr-only">
            Pricing Tiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Starter Plan */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Starter
                  </span>
                  <h3 className="text-2xl font-bold text-zinc-100 mt-1">Agency Free</h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    Ideal for boutique agencies and freelancers getting started with live reporting.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-zinc-100">$0</span>
                  <span className="text-sm text-zinc-500 font-medium">/ month</span>
                </div>

                <ul className="space-y-3.5 text-sm text-zinc-300 pt-4 border-t border-zinc-800">
                  {[
                    'Up to 3 active agency clients',
                    'Dedicated live client portal links',
                    'Google Ads & Meta Ads tracking',
                    'Automated CPL & conversion calculations',
                    'Community support',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-lime-400/10 text-lime-400 flex items-center justify-center shrink-0">
                        <IconCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-center font-semibold text-sm transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="bg-zinc-900 border-2 border-lime-400/70 rounded-3xl p-8 sm:p-10 flex flex-col justify-between space-y-8 relative shadow-xl shadow-lime-400/5">
              <div className="absolute -top-3.5 right-8 bg-lime-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-lime-400">
                    Pro
                  </span>
                  <h3 className="text-2xl font-bold text-zinc-100 mt-1">Agency Growth</h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    For scaling marketing agencies managing extensive client campaign portfolios.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-zinc-100">$49</span>
                  <span className="text-sm text-zinc-500 font-medium">/ month</span>
                </div>

                <ul className="space-y-3.5 text-sm text-zinc-300 pt-4 border-t border-zinc-800">
                  {[
                    'Unlimited active clients',
                    'Customizable client portal links',
                    'Team role-based access control',
                    'Historical telemetry exports',
                    'Cross-client performance benchmarking',
                    'Priority agency onboarding & support',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-lime-400 text-black flex items-center justify-center shrink-0 font-bold">
                        <IconCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-zinc-100 font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full py-3.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black text-center font-semibold text-sm transition-transform active:scale-95 shadow-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 id="faq-heading" className="text-3xl font-bold tracking-tight text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">
              Everything you need to know about ReportPilot pricing and account management.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <h3 className="text-base font-bold text-zinc-100">{faq.question}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
