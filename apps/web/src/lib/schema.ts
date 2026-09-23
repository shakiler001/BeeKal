import { ASSESSMENT, SITE } from '@/content/site';
import type { Solution } from '@/content/solutions';
import type { CaseStudy } from '@/content/case-studies';
import type { Article } from '@/content/articles';

/**
 * Structured data, generated from the same records the page renders.
 *
 * The demo noted that its FAQ schema mirrored the visible FAQ word for word.
 * Generating both from one source makes that a guarantee instead of a
 * discipline — the schema cannot drift and quietly break the rich result
 * (docs/05 section 1.3).
 *
 * Deliberately absent: Review and AggregateRating. There are no genuine reviews
 * yet, and fabricating them is both against master prompt section 28 and a
 * manual-action risk.
 */

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://beekal.com';

const url = (path = '') => `${BASE_URL}${path}`;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': url('/#organization'),
    name: SITE.name,
    slogan: SITE.tagline,
    description:
      'Beekal designs and builds the software, automation and AI systems that make growing businesses easier to operate and easier to scale.',
    url: url(),
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dhaka',
      addressCountry: 'BD',
    },
    founder: {
      '@type': 'Person',
      name: SITE.founderName,
      jobTitle: SITE.founderRole,
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Business process automation',
      'Legacy software modernization',
      'Custom business software',
      'System integration',
      'Applied artificial intelligence',
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': url('/#website'),
    name: SITE.name,
    url: url(),
    publisher: { '@id': url('/#organization') },
  };
}

export function serviceSchema(solution: Solution) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: solution.name,
    serviceType: solution.seoTitle,
    description: solution.seoDescription,
    url: url(`/solutions/${solution.slug}`),
    provider: { '@id': url('/#organization') },
    areaServed: 'Worldwide',
  };
}

/** Generated from the FAQ rows so the markup and the page cannot disagree. */
export function faqSchema(faqs: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function assessmentServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: ASSESSMENT.name,
    description: ASSESSMENT.lede,
    url: url('/assessment'),
    provider: { '@id': url('/#organization') },
    // No `offers` block: publishing a price in structured data before a real
    // published price exists would be a claim we cannot support.
  };
}

export function breadcrumbSchema(trail: ReadonlyArray<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: url(item.path),
    })),
  };
}

/**
 * A case study is only described as a real case when it is not illustrative.
 * An example scenario gets no structured data at all — marking a hypothetical
 * as a client result is exactly what master prompt section 28 forbids.
 */
export function caseStudySchema(c: CaseStudy) {
  if (c.isIllustrative) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.problem,
    url: url(`/work/${c.slug}`),
    author: { '@id': url('/#organization') },
    publisher: { '@id': url('/#organization') },
  };
}

export function articleSchema(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    url: url(`/insights/${article.slug}`),
    datePublished: article.publishedAt,
    keywords: article.tags.join(', '),
    author: { '@id': url('/#organization') },
    publisher: { '@id': url('/#organization') },
    inLanguage: 'en',
  };
}
