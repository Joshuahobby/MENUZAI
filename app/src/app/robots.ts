import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/features', '/pricing', '/demo', '/terms', '/privacy'],
      disallow: [
        '/dashboard/',
        '/onboarding/',
        '/login',
        '/api/',
        '/ai-result/',
        '/menu/*/order', // Don't index order pages
      ],
    },
    sitemap: 'https://menuzaai.com/sitemap.xml',
  };
}
