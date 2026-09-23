import { notFound } from 'next/navigation';
import type { Block } from '@beekal/contracts';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { ArticleEditor, type ArticleFormValues } from '@/features/admin/article-editor';

export const metadata = { title: 'Article' };

interface ArticleRow extends Omit<ArticleFormValues, 'body' | 'tags'> {
  body: unknown;
  tags: unknown;
}

/**
 * The body is a JSON column. Anything that is not a block the renderer knows is
 * dropped here rather than handed to an editor that would then write it back.
 */
function toBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  return value.filter((b): b is Block => {
    if (typeof b !== 'object' || b === null) return false;
    const { type } = b as { type?: unknown };
    return type === 'p' || type === 'h2' || type === 'list' || type === 'quote';
  });
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!can(session, 'article:read')) notFound();

  const rows = await adminApi
    .get<ArticleRow[]>('/content/articles')
    .catch(() => [] as ArticleRow[]);
  const row = rows.find((a) => a.id === id);
  if (!row) notFound();

  return (
    <>
      <AdminPageHeader
        title={row.title}
        description="Changes reach the site within seconds of publishing."
      />
      <ArticleEditor
        initial={{
          ...row,
          body: toBlocks(row.body),
          tags: Array.isArray(row.tags)
            ? row.tags.filter((t): t is string => typeof t === 'string')
            : [],
        }}
        canPublish={can(session, 'article:publish')}
        canDelete={can(session, 'article:delete')}
      />
    </>
  );
}
