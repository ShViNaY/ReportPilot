// app/privacy/page.tsx

import type { Metadata } from 'next';
import { PublicHeader } from '@/components/landing/PublicHeader';
import { PublicFooter } from '@/components/landing/PublicFooter';
import { getBreadcrumbJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how ReportPilot protects agency and client data with end-to-end multi-tenant isolation, Supabase encryption, and strict privacy controls.',
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/privacy' },
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
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Last Updated: September 2026 • Effective Date: Immediately
          </p>
        </header>

        <article className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">1. Overview & Data Philosophy</h2>
            <p>
              ReportPilot is built from the ground up with strict data isolation. We recognize that marketing performance numbers, client identities, and advertising telemetry represent confidential business intelligence. We do not sell, rent, or monetize your agency data or client metrics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">2. Information We Process</h2>
            <p>
              We collect and process the following categories of information to provide the ReportPilot service:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Account Credentials:</strong> Work email, hashed passwords (using industry-standard bcrypt/Argon2 algorithms), and agency name.
              </li>
              <li>
                <strong className="text-zinc-200">Campaign & Performance Telemetry:</strong> Client identifiers, platform sources (Google Ads, Meta Ads), ad spend figures, lead counts, and conversion counts entered by your agency team.
              </li>
              <li>
                <strong className="text-zinc-200">Technical Data:</strong> IP addresses and user-agent strings collected temporarily for rate limiting, DDoS defense, and security audit logs.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">3. Multi-Tenant Isolation & Row-Level Security</h2>
            <p>
              All application data is segregated at the database layer using PostgreSQL Row-Level Security (RLS) via Supabase. Agency workspace members can only view data that explicitly belongs to their authenticated agency ID.
            </p>
            <p>
              Client portals operate through cryptographically random 64-character tokens. These tokens only grant read-only access strictly to the metrics associated with that specific client record.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">4. Third-Party Service Providers</h2>
            <p>
              We partner with trusted infrastructure providers that adhere to rigorous security standards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Database & Authentication:</strong> Supabase (hosted on AWS with encryption at rest and in transit).
              </li>
              <li>
                <strong className="text-zinc-200">Application Hosting:</strong> Vercel (edge delivery, DDoS mitigation, and SSL enforcement).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100">5. Your Data Rights</h2>
            <p>
              Agencies retain full ownership of all client and performance data entered into ReportPilot. You may export or request deletion of your workspace data at any time by contacting our support team at <span className="text-lime-400 font-mono">support@reportpilot.com</span>.
            </p>
          </section>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
