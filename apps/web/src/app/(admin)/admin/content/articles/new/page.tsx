import { notFound } from 'next/navigation';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { ArticleEditor, EMPTY_ARTICLE } from '@/features/admin/article-editor';

export const metadata = { title: 'New article' };

export default async function NewArticlePage() {
  const session = await requireSession();
  if (!can(session, 'article:create')) notFound();

  return (
    <>
      <AdminPageHeader
        title="New article"
        description="It saves as a draft. The publication date is set the first time you publish, and never moves after that."
      />
      <ArticleEditor
        initial={EMPTY_ARTICLE}
        canPublish={can(session, 'article:publish')}
        canDelete={false}
      />
    </>
  );
}
