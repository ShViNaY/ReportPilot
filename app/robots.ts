// app/robots.ts

import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/utils/url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/features',
          '/pricing',
          '/contact',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/campaigns/',
          '/clients/',
          '/metrics/',
          '/team/',
          '/portal/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
