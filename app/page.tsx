import type { Metadata } from 'next';
import { HomePageClient } from '@/components/landing/HomePageClient';
import {
  getSoftwareApplicationJsonLd,
  getOrganizationJsonLd,
  getWebsiteJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'ReportPilot | Marketing Reporting for Agencies',
  description:
    'Client reports, without the deck. One dashboard for all client ad metrics live, with automated CPL, spend, and conversion telemetry, and tokenized client portals.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const jsonLd = [
    getWebsiteJsonLd(),
    getOrganizationJsonLd(),
    getSoftwareApplicationJsonLd(),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient />
    </>
  );
}