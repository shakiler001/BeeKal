import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { CaseStudyEditor, type CaseStudyFormValues } from '@/features/admin/case-study-editor';

export const metadata = { title: 'Case study' };

interface SolutionOption {
  key: string;
  name: string;
}

interface CaseStudyRow extends Omit<CaseStudyFormValues, 'clientName' | 'results'> {
  clientName: string | null;
  results: unknown;
}

/** The JSON column arrives as unknown; anything malformed costs its own row. */
function toResults(value: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(value)) return [{ value: '', label: '' }];
  const rows = value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { value: v, label } = entry as { value?: unknown; label?: unknown };
    if (typeof v !== 'string' || typeof label !== 'string') return [];
    return [{ value: v, label }];
  });
  return rows.length > 0 ? rows : [{ value: '', label: '' }];
}

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!can(session, 'case_study:read')) notFound();

  const [rows, solutions] = await Promise.all([
    adminApi.get<CaseStudyRow[]>('/content/case-studies').catch(() => [] as CaseStudyRow[]),
    adminApi.get<SolutionOption[]>('/content/solutions').catch(() => [] as SolutionOption[]),
  ]);

  const row = rows.find((c) => c.id === id);
  if (!row) notFound();

  return (
    <>
      <AdminPageHeader
        title={row.title}
        description="Changes reach the site within seconds of publishing."
      />
      <CaseStudyEditor
        initial={{ ...row, clientName: row.clientName ?? '', results: toResults(row.results) }}
        solutions={solutions}
        canPublish={can(session, 'case_study:publish')}
        canDelete={can(session, 'case_study:delete')}
      />
    </>
  );
}
