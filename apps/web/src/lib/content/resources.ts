import 'server-only';
import { RESOURCES as BASELINE, type Resource } from '@/content/resources';
import { fetchContent } from './source';
import { CONTENT_TAGS } from './tags';

/**
 * Resources, read from the database.
 *
 * `kind` drives a label and the wording of the download button, so a row naming
 * a kind the site has no label for would render a gap. Unknown kinds fall back
 * to 'guide' rather than being dropped: the resource itself is still useful, and
 * the worst outcome of the fallback is a slightly wrong noun.
 *
 * `fileUrl` is null until a file exists. A resource with no file and no external
 * link is a promise the site cannot keep, so the page filters those out — the
 * row stays, it simply does not offer a download.
 */

const KINDS = new Set<Resource['kind']>(['checklist', 'guide', 'tool']);

interface ResourceRow {
  slug: unknown;
  title: unknown;
  description: unknown;
  kind: unknown;
  contents: unknown;
  isGated: unknown;
  fileUrl: unknown;
  seoTitle: unknown;
  seoDescription: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function toResource(row: ResourceRow): Resource | null {
  const slug = str(row.slug);
  if (!slug) return null;

  const kind = str(row.kind) as Resource['kind'];

  return {
    slug,
    title: str(row.title),
    description: str(row.description),
    kind: KINDS.has(kind) ? kind : 'guide',
    contents: Array.isArray(row.contents)
      ? row.contents.filter((x): x is string => typeof x === 'string')
      : [],
    // Gated unless the row explicitly says otherwise. Defaulting the other way
    // would hand out something meant to be exchanged for an email address.
    isGated: row.isGated !== false,
    fileUrl: typeof row.fileUrl === 'string' && row.fileUrl !== '' ? row.fileUrl : null,
    seoTitle: str(row.seoTitle),
    seoDescription: str(row.seoDescription),
  };
}

export async function getResources(): Promise<Resource[]> {
  const rows = await fetchContent<ResourceRow[]>('resources', CONTENT_TAGS.resources);
  if (rows === null) return BASELINE;
  return rows.map(toResource).filter((r): r is Resource => r !== null);
}
