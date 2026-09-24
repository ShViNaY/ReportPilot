// app/terms/page.tsx

import type { Metadata } from 'next';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { PublicFooter } from '@/components/landing/PublicFooter';
import { getBreadcrumbJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Review the ReportPilot terms of service covering agency workspace usage, account responsibilities, and client data ownership.',
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/terms' },
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lime-400 selection:text-black flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-6 py-20 sm:py-28 space-y-12">
        <header className="space-y-4 border-b border-zinc-800 pb-8">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-100">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Last Updated: September 2026 • Effective Date: Immediately
          </p>
        </header>

        <article className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ReportPilot, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of an agency, company, or other legal entity, you represent that you have the authority to bind such entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">2. Service Description & Access</h2>
            <p>
              ReportPilot provides a web-based reporting dashboard and client portal platform designed for digital marketing agencies. Subject to these terms, we grant your agency a non-exclusive, non-transferable right to access and use the platform for your internal agency operations and client reporting.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">3. Agency Accounts & Security</h2>
            <p>
              You are responsible for safeguarding your agency account credentials and ensuring that authorized team members comply with your agency’s confidentiality policies. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">4. Client Data Ownership</h2>
            <p>
              You retain all rights, title, and interest in and to all data, campaign figures, client metrics, and materials submitted to ReportPilot. ReportPilot does not acquire any ownership rights in your client data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">5. Fair Usage & Prohibited Conduct</h2>
            <p>
              You agree not to probe, scan, or test the vulnerability of the system, circumvent security controls or rate limits, reverse engineer the platform, or transmit malicious code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">6. Contact Information</h2>
            <p>
              Questions regarding these Terms of Service should be directed to{' '}
              <span className="text-lime-400 font-mono">support@reportpilot.com</span>.
            </p>
          </section>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
