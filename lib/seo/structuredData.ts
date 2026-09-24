// lib/seo/structuredData.ts

import { getBaseUrl } from '@/lib/utils/url';

/**
 * Generates Schema.org Organization structured data.
 * Reflects genuine company information without exaggeration.
 */
export function getOrganizationJsonLd() {
  const baseUrl = getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ReportPilot',
    url: baseUrl,
    logo: `${baseUrl}/opengraph-image`,
    description:
      'Real-time campaign reporting dashboards and tokenized client portals for digital marketing agencies.',
  };
}

/**
 * Generates Schema.org WebSite structured data.
 */
export function getWebsiteJsonLd() {
  const baseUrl = getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ReportPilot',
    url: baseUrl,
    description:
      'Marketing reporting dashboard for digital agencies. Live ad spend, lead tracking, and client portals.',
  };
}

/**
 * Generates Schema.org SoftwareApplication structured data.
 * Accurately describes ReportPilot without fabricated ratings or reviews.
 */
export function getSoftwareApplicationJsonLd() {
  const baseUrl = getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ReportPilot',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All (Web-based SaaS)',
    url: baseUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free starter plan for marketing agencies. No credit card required.',
    },
    description:
      'Centralized campaign reporting platform for digital agencies to track Google Ads and Meta Ads metrics and share live, read-only portals with clients.',
    featureList: [
      'Multi-client agency overview dashboard',
      'Automated cost-per-lead and conversion calculation',
      'Tokenized, read-only live client portal links',
      'Google Ads and Meta Ads metric aggregation',
      'Role-based access control for agency team members',
    ],
  };
}

/**
 * Generates Schema.org BreadcrumbList structured data for public pages.
 */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  const baseUrl = getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generates Schema.org FAQPage structured data.
 * Only used on pages where the questions and answers appear verbatim in the page content.
 */
export function getFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
