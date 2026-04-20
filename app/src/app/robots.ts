import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/pricing'],
      disallow: [
        '/dashboard/',
        '/onboarding/',
        '/login',
        '/api/',
        '/ai-result/',
        '/menu/*/order', // Don't index order pages
      ],
    },
    // We'll set the sitemap URL here once we decide the production domain
    // sitemap: 'https://menuzai.com/sitemap.xml',
  };
}
