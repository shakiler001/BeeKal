import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { SolutionEditor, type SolutionFormValues } from '@/features/admin/solution-editor';

export const metadata = { title: 'Category' };

interface SolutionRow extends Omit<SolutionFormValues, 'signs' | 'whatWeDo' | 'before' | 'after'> {
  signs: unknown;
  whatWeDo: unknown;
  before: unknown;
  after: unknown;
}

/** JSON columns arrive as unknown; anything that is not a string is dropped. */
const lines = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

export default async function EditSolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!can(session, 'solution:read')) notFound();

  const rows = await adminApi
    .get<SolutionRow[]>('/content/solutions')
    .catch(() => [] as SolutionRow[]);

  const row = rows.find((s) => s.id === id);
  if (!row) notFound();

  return (
    <>
      <AdminPageHeader
        title={row.name}
        description="Changes reach the site within seconds of publishing."
      />
      <SolutionEditor
        initial={{
          ...row,
          signs: lines(row.signs),
          whatWeDo: lines(row.whatWeDo),
          before: lines(row.before),
          after: lines(row.after),
        }}
        canPublish={can(session, 'solution:publish')}
        canDelete={can(session, 'solution:delete')}
      />
    </>
  );
}
