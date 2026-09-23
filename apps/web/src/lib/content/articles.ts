import 'server-only';
import { ARTICLES as BASELINE, type Article, type Block } from '@/content/articles';
import { fetchContent } from './source';
import { CONTENT_TAGS } from './tags';

/**
 * Articles, read from the database.
 *
 * The body is a list of blocks rather than HTML, so it arrives as JSON and each
 * block is checked before it reaches a renderer that switches on `type`. A block
 * of an unknown shape is dropped: the article loses a paragraph, rather than the
 * page losing its renderer to an unhandled case.
 *
 * `publishedAt` is a date the API returns as a string. It is kept as a string
 * here because that is what the page and the structured data both want, and
 * parsing it only to format it again would be work for nobody.
 */

interface ArticleRow {
  slug: unknown;
  title: unknown;
  excerpt: unknown;
  tags: unknown;
  readMinutes: unknown;
  publishedAt: unknown;
  body: unknown;
  seoTitle: unknown;
  seoDescription: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function toBlock(value: unknown): Block | null {
  if (typeof value !== 'object' || value === null) return null;
  const b = value as { type?: unknown; text?: unknown; items?: unknown; attribution?: unknown };

  switch (b.type) {
    case 'p':
    case 'h2':
      return typeof b.text === 'string' ? { type: b.type, text: b.text } : null;
    case 'list': {
      const items = strings(b.items);
      return items.length > 0 ? { type: 'list', items } : null;
    }
    case 'quote':
      if (typeof b.text !== 'string') return null;
      return typeof b.attribution === 'string'
        ? { type: 'quote', text: b.text, attribution: b.attribution }
        : { type: 'quote', text: b.text };
    default:
      return null;
  }
}

function toArticle(row: ArticleRow): Article | null {
  const slug = str(row.slug);
  if (!slug) return null;

  const body = Array.isArray(row.body)
    ? row.body.map(toBlock).filter((b): b is Block => b !== null)
    : [];

  return {
    slug,
    title: str(row.title),
    excerpt: str(row.excerpt),
    tags: strings(row.tags),
    readMinutes: typeof row.readMinutes === 'number' ? row.readMinutes : 4,
    // A published article always has a date; the fallback keeps sorting total
    // rather than leaving one row incomparable.
    publishedAt: str(row.publishedAt) || new Date(0).toISOString(),
    body,
    seoTitle: str(row.seoTitle),
    seoDescription: str(row.seoDescription),
  };
}

export async function getArticles(): Promise<Article[]> {
  const rows = await fetchContent<ArticleRow[]>('articles', CONTENT_TAGS.articles);
  if (rows === null) return BASELINE;
  return rows.map(toArticle).filter((a): a is Article => a !== null);
}

/** Newest first, which is how the index reads and how the sitemap lists them. */
export async function getPublishedArticles(): Promise<Article[]> {
  return [...(await getArticles())].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  return (await getArticles()).find((a) => a.slug === slug);
}
