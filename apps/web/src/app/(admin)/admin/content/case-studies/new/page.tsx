import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { CaseStudyEditor, EMPTY_CASE_STUDY } from '@/features/admin/case-study-editor';

export const metadata = { title: 'New case study' };

interface SolutionOption {
  key: string;
  name: string;
}

export default async function NewCaseStudyPage() {
  const session = await requireSession();
  if (!can(session, 'case_study:create')) notFound();

  // The categories come from the database, so the picker offers whatever is
  // there rather than a list compiled into the admin.
  const solutions = await adminApi
    .get<SolutionOption[]>('/content/solutions')
    .catch(() => [] as SolutionOption[]);

  return (
    <>
      <AdminPageHeader
        title="New case study"
        description="It saves as a draft. Nothing reaches the site until you publish it."
      />
      <CaseStudyEditor
        initial={EMPTY_CASE_STUDY}
        solutions={solutions}
        canPublish={can(session, 'case_study:publish')}
        canDelete={false}
      />
    </>
  );
}
