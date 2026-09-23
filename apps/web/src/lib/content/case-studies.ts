import 'server-only';
import { CASE_STUDIES as BASELINE, type CaseResult, type CaseStudy } from '@/content/case-studies';
import type { SolutionKey } from '@/content/solutions';
import { fetchContent } from './source';
import { CONTENT_TAGS } from './tags';

/**
 * Case studies, read from the database.
 *
 * The API returns published rows only — the filter is in the query, so a draft
 * never leaves the database — ordered featured-first. Everything below is
 * mapping and narrowing, because a row from Postgres is not yet the shape a
 * component should be handed:
 *
 *  - `results` is a JSON column, so it arrives as `unknown` and is validated
 *    rather than cast. A malformed row costs that row its results, not the page.
 *  - `solutionKey` is a plain string in the database. The union it has to
 *    satisfy lives in the repository, so a row naming a category the site does
 *    not know about is dropped here rather than rendering a broken link.
 *
 * That second rule is the one to remember when adding a category: the database
 * accepts it before the site does.
 */

interface CaseStudyRow {
  slug: unknown;
  title: unknown;
  clientName: unknown;
  context: unknown;
  solutionKey: unknown;
  tabLabel: unknown;
  problem: unknown;
  before: unknown;
  beforeLead: unknown;
  diagnosis: unknown;
  whatChanged: unknown;
  howBuilt: unknown;
  results: unknown;
  lesson: unknown;
  isIllustrative: unknown;
  featured: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function toResults(value: unknown): CaseResult[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): CaseResult[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { value: v, label } = entry as { value?: unknown; label?: unknown };
    if (typeof v !== 'string' || typeof label !== 'string') return [];
    return [{ value: v, label }];
  });
}

function toCaseStudy(row: CaseStudyRow): CaseStudy | null {
  const slug = str(row.slug);
  if (!slug) return null;

  // No longer checked against a fixed list of categories. Categories are rows
  // and the founder can add one, so a case study naming a category this build
  // has never heard of is normal rather than corrupt. Pages resolve the key
  // when they render and omit the label when it resolves to nothing.
  const solutionKey = str(row.solutionKey);

  return {
    slug,
    title: str(row.title),
    clientName: typeof row.clientName === 'string' ? row.clientName : null,
    context: str(row.context),
    solutionKey,
    tabLabel: str(row.tabLabel),
    problem: str(row.problem),
    before: str(row.before),
    beforeLead: str(row.beforeLead),
    diagnosis: str(row.diagnosis),
    whatChanged: str(row.whatChanged),
    howBuilt: str(row.howBuilt),
    results: toResults(row.results),
    lesson: str(row.lesson),
    // Defaults chosen so a malformed row is treated as illustrative and not
    // featured. Getting this backwards would publish an unverified case study
    // as a real one, which is the one mistake this codebase must not make.
    isIllustrative: row.isIllustrative !== false,
    featured: row.featured === true,
  };
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const rows = await fetchContent<CaseStudyRow[]>('case-studies', CONTENT_TAGS.caseStudies);

  // The baseline is already in the right shape, so it skips the mapping.
  if (rows === null) return BASELINE;

  return rows.map(toCaseStudy).filter((c): c is CaseStudy => c !== null);
}

export async function getFeaturedCaseStudies(): Promise<CaseStudy[]> {
  return (await getCaseStudies()).filter((c) => c.featured);
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | undefined> {
  return (await getCaseStudies()).find((c) => c.slug === slug);
}

export async function getCaseStudiesFor(solutionKey: SolutionKey): Promise<CaseStudy[]> {
  return (await getCaseStudies()).filter((c) => c.solutionKey === solutionKey);
}
