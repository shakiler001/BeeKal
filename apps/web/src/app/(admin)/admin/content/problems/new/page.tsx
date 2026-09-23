import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { EMPTY_PROBLEM, ProblemEditor } from '@/features/admin/problem-editor';

export const metadata = { title: 'New problem page' };

interface SolutionOption {
  key: string;
  name: string;
}

export default async function NewProblemPage() {
  const session = await requireSession();
  if (!can(session, 'problem:create')) notFound();

  const solutions = await adminApi
    .get<SolutionOption[]>('/content/solutions')
    .catch(() => [] as SolutionOption[]);

  return (
    <>
      <AdminPageHeader
        title="New problem page"
        description="A landing page for people searching the symptom rather than the service. It saves as a draft."
      />
      <ProblemEditor
        initial={EMPTY_PROBLEM}
        solutions={solutions}
        canPublish={can(session, 'problem:publish')}
        canDelete={false}
      />
    </>
  );
}
