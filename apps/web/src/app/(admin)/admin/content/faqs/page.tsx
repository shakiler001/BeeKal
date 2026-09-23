import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { FaqEditor, type FaqRow } from '@/features/admin/faq-editor';

export const metadata = { title: 'FAQs' };

export default async function FaqsPage() {
  const session = await requireSession();
  if (!can(session, 'faq:read')) notFound();

  const rows = await adminApi.get<FaqRow[]>('/content/faqs').catch(() => [] as FaqRow[]);

  return (
    <>
      <AdminPageHeader
        title="FAQs"
        description="The booking objections on the assessment page. They also generate its structured data, so the page and the search result cannot disagree."
      />
      <FaqEditor
        initial={rows}
        canCreate={can(session, 'faq:create')}
        canUpdate={can(session, 'faq:update')}
        canDelete={can(session, 'faq:delete')}
      />
    </>
  );
}
