import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
      {
        userAgent: [
          'Googlebot',
          'Googlebot-Image',
          'Googlebot-News',
          'Googlebot-Video',
          'Bingbot',
          'MSNBot',
          'Slurp',
          'DuckDuckBot',
          'Baiduspider',
          'YandexBot',
          'Sogou',
          'Exabot',
          'Applebot',
          'facebookexternalhit',
          'Twitterbot',
          'LinkedInBot',
          'Pinterestbot',
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'PerplexityBot',
          'anthropic-ai',
          'CCBot',
          'Bytespider',
        ],
        disallow: '/',
      },
    ],
  };
}
