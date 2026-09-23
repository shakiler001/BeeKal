import 'server-only';
import { SOLUTIONS as BASELINE, type Solution } from '@/content/solutions';
import { fetchContent } from './source';
import { CONTENT_TAGS } from './tags';

/**
 * Solutions, read from the database.
 *
 * This is the type that turns "five named categories" from a constant into
 * something the founder owns. Adding one is now a row, not a release.
 *
 * The four list columns — signs, what we do, before, after — are JSON, so they
 * arrive as `unknown` and are narrowed rather than cast. A malformed list costs
 * that list, not the page: a solution with no "signs" still renders everything
 * else, which is a better outcome than a 500 on the page that explains what the
 * company sells.
 */

interface SolutionRow {
  key: unknown;
  slug: unknown;
  name: unknown;
  cardHeadline: unknown;
  cardBody: unknown;
  pageHeadline: unknown;
  pageIntro: unknown;
  signs: unknown;
  whatWeDo: unknown;
  before: unknown;
  after: unknown;
  seoTitle: unknown;
  seoDescription: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function toSolution(row: SolutionRow): Solution | null {
  const key = str(row.key);
  const slug = str(row.slug);
  // Both identify the record — one in a URL, one from a case study. A row
  // missing either cannot be linked to, so it is dropped rather than rendered
  // as a dead end.
  if (!key || !slug) return null;

  return {
    key,
    slug,
    name: str(row.name),
    cardHeadline: str(row.cardHeadline),
    cardBody: str(row.cardBody),
    pageHeadline: str(row.pageHeadline),
    pageIntro: str(row.pageIntro),
    signs: strings(row.signs),
    whatWeDo: strings(row.whatWeDo),
    before: strings(row.before),
    after: strings(row.after),
    seoTitle: str(row.seoTitle),
    seoDescription: str(row.seoDescription),
  };
}

export async function getSolutions(): Promise<Solution[]> {
  const rows = await fetchContent<SolutionRow[]>('solutions', CONTENT_TAGS.solutions);
  if (rows === null) return BASELINE;
  return rows.map(toSolution).filter((s): s is Solution => s !== null);
}

export async function getSolution(slug: string): Promise<Solution | undefined> {
  return (await getSolutions()).find((s) => s.slug === slug);
}

/**
 * Undefined when the key names no published solution.
 *
 * That happens for real now: a case study keeps its `solutionKey` when the
 * category is unpublished or deleted. Callers decide what to show — usually
 * nothing, rather than a link to a page that no longer exists.
 */
export async function getSolutionByKey(key: string): Promise<Solution | undefined> {
  return (await getSolutions()).find((s) => s.key === key);
}
