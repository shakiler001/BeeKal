import 'server-only';
import { PROBLEMS as BASELINE, type Problem } from '@/content/problems';
import { fetchContent } from './source';
import { CONTENT_TAGS } from './tags';

/**
 * Problem pages, read from the database.
 *
 * These are the landing pages cold traffic arrives on: a buyer searches for the
 * symptom, not the service. Each names the solution it usually leads to, and
 * that link is a plain string — the category may have been removed since, and
 * pages resolve it at render time rather than trusting it here.
 *
 * `diagnostic` and `fixLooksLike` are JSON columns, so they are narrowed rather
 * than cast. A row that loses its diagnostic list still renders the rest of the
 * page, which is better than a 500 on a page an advert points at.
 */

interface ProblemRow {
  key: unknown;
  slug: unknown;
  cardHeadline: unknown;
  cardAnswer: unknown;
  cardBody: unknown;
  pageHeadline: unknown;
  pageIntro: unknown;
  diagnostic: unknown;
  causes: unknown;
  fixLooksLike: unknown;
  solutionKey: unknown;
  seoTitle: unknown;
  seoDescription: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function toProblem(row: ProblemRow): Problem | null {
  const key = str(row.key);
  const slug = str(row.slug);
  if (!key || !slug) return null;

  return {
    key,
    slug,
    cardHeadline: str(row.cardHeadline),
    cardAnswer: str(row.cardAnswer),
    cardBody: str(row.cardBody),
    pageHeadline: str(row.pageHeadline),
    pageIntro: str(row.pageIntro),
    diagnostic: strings(row.diagnostic),
    causes: str(row.causes),
    fixLooksLike: strings(row.fixLooksLike),
    solutionKey: str(row.solutionKey),
    seoTitle: str(row.seoTitle),
    seoDescription: str(row.seoDescription),
  };
}

export async function getProblems(): Promise<Problem[]> {
  const rows = await fetchContent<ProblemRow[]>('problems', CONTENT_TAGS.problems);
  if (rows === null) return BASELINE;
  return rows.map(toProblem).filter((p): p is Problem => p !== null);
}

export async function getProblem(slug: string): Promise<Problem | undefined> {
  return (await getProblems()).find((p) => p.slug === slug);
}

export async function getProblemsFor(solutionKey: string): Promise<Problem[]> {
  return (await getProblems()).filter((p) => p.solutionKey === solutionKey);
}
