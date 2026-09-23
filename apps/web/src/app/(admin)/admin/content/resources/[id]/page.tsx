import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { ResourceEditor, type ResourceFormValues } from '@/features/admin/resource-editor';

export const metadata = { title: 'Resource' };

interface ResourceRow extends Omit<ResourceFormValues, 'contents' | 'fileUrl'> {
  contents: unknown;
  fileUrl: string | null;
}

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!can(session, 'resource:read')) notFound();

  const rows = await adminApi
    .get<ResourceRow[]>('/content/resources')
    .catch(() => [] as ResourceRow[]);
  const row = rows.find((r) => r.id === id);
  if (!row) notFound();

  return (
    <>
      <AdminPageHeader
        title={row.title}
        description="Changes reach the site within seconds of publishing."
      />
      <ResourceEditor
        initial={{
          ...row,
          contents: Array.isArray(row.contents)
            ? row.contents.filter((c): c is string => typeof c === 'string')
            : [],
          fileUrl: row.fileUrl ?? '',
        }}
        canPublish={can(session, 'resource:publish')}
        canDelete={can(session, 'resource:delete')}
      />
    </>
  );
}
