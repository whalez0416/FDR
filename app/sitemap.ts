import type { MetadataRoute } from 'next';
import { ARTICLES } from '@/lib/guide/articles';

const BASE = 'https://www.mompyeon.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/guide`, changeFrequency: 'weekly', priority: 0.8 },
    ...ARTICLES.map((a) => ({
      url: `${BASE}/guide/${a.slug}`,
      lastModified: a.date,
      priority: 0.7,
    })),
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
  ];
}
