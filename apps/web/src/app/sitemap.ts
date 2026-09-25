import type { MetadataRoute } from 'next';
import { getSolutions } from '@/lib/content/solutions';
import { getProblems } from '@/lib/content/problems';
import { getCaseStudies } from '@/lib/content/case-studies';
import { getPublishedArticles } from '@/lib/content/articles';
import { getResources } from '@/lib/content/resources';

const BASE = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://beekal.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [caseStudies, solutions, problems, articles, resources] = await Promise.all([
    getCaseStudies(),
    getSolutions(),
    getProblems(),
    getPublishedArticles(),
    getResources(),
  ]);
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
    ...solutions.map((s) => ({
      url: `${BASE}/solutions/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...problems.map((p) => ({
      url: `${BASE}/problems/${p.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${BASE}/insights/${a.slug}`,
      lastModified: new Date(a.publishedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    // Only resources that actually exist. Listing a page that says "coming
    // soon" wastes a crawl and disappoints a click.
    ...resources
      .filter((r) => r.isGated && r.hasFile)
      .map((r) => ({
        url: `${BASE}/resources/${r.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    // Illustrative case studies are excluded: they are noindex, and listing a
    // noindex URL in the sitemap sends Google a contradictory signal.
    ...caseStudies
      .filter((c) => !c.isIllustrative)
      .map((c) => ({
        url: `${BASE}/work/${c.slug}`,
        lastModified: now,
        changeFrequency: 'yearly' as const,
        priority: 0.7,
      })),
  ];
}
