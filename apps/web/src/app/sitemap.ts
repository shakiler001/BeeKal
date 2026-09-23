import type { MetadataRoute } from 'next';
import { SOLUTIONS } from '@/content/solutions';
import { PROBLEMS } from '@/content/problems';
import { CASE_STUDIES } from '@/content/case-studies';
import { PUBLISHED_ARTICLES } from '@/content/articles';
import { RESOURCES } from '@/content/resources';

const BASE = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://beekal.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/assessment', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/solutions', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/work', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/score', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/method', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/insights', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/resources', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  return [
    ...staticPages.map((p) => ({
      url: `${BASE}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...SOLUTIONS.map((s) => ({
      url: `${BASE}/solutions/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...PROBLEMS.map((p) => ({
      url: `${BASE}/problems/${p.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...PUBLISHED_ARTICLES.map((a) => ({
      url: `${BASE}/insights/${a.slug}`,
      lastModified: new Date(a.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    // Only resources that actually exist. Listing a page that says "coming
    // soon" wastes a crawl and disappoints a click.
    ...RESOURCES.filter((r) => r.fileUrl !== null).map((r) => ({
      url: `${BASE}/resources/${r.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Illustrative case studies are excluded: they are noindex, and listing a
    // noindex URL in the sitemap sends Google a contradictory signal.
    ...CASE_STUDIES.filter((c) => !c.isIllustrative).map((c) => ({
      url: `${BASE}/work/${c.slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ];
}
