// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tipout.org';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'], // Protect backend and auth endpoints from public crawling
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}