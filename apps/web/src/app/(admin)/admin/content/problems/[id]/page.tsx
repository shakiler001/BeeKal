import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { ProblemEditor, type ProblemFormValues } from '@/features/admin/problem-editor';

export const metadata = { title: 'Problem page' };

interface SolutionOption {
  key: string;
  name: string;
}

interface ProblemRow extends Omit<ProblemFormValues, 'diagnostic' | 'fixLooksLike'> {
  diagnostic: unknown;
  fixLooksLike: unknown;
}

const lines = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

export default async function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!can(session, 'problem:read')) notFound();

  const [rows, solutions] = await Promise.all([
    adminApi.get<ProblemRow[]>('/content/problems').catch(() => [] as ProblemRow[]),
    adminApi.get<SolutionOption[]>('/content/solutions').catch(() => [] as SolutionOption[]),
  ]);

  const row = rows.find((p) => p.id === id);
  if (!row) notFound();

  return (
    <>
      <AdminPageHeader
        title={row.cardHeadline}
        description="Changes reach the site within seconds of publishing."
      />
      <ProblemEditor
        initial={{
          ...row,
          diagnostic: lines(row.diagnostic),
          fixLooksLike: lines(row.fixLooksLike),
        }}
        solutions={solutions}
        canPublish={can(session, 'problem:publish')}
        canDelete={can(session, 'problem:delete')}
      />
    </>
  );
}
