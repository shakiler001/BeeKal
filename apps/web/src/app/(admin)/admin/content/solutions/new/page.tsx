import { notFound } from 'next/navigation';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { EMPTY_SOLUTION, SolutionEditor } from '@/features/admin/solution-editor';

export const metadata = { title: 'New category' };

export default async function NewSolutionPage() {
  const session = await requireSession();
  if (!can(session, 'solution:create')) notFound();

  return (
    <>
      <AdminPageHeader
        title="New category"
        description="It saves as a draft. It appears in the case study picker immediately, and on the site once you publish it."
      />
      <SolutionEditor
        initial={EMPTY_SOLUTION}
        canPublish={can(session, 'solution:publish')}
        canDelete={false}
      />
    </>
  );
}
