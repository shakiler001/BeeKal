import { notFound } from 'next/navigation';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { EMPTY_RESOURCE, ResourceEditor } from '@/features/admin/resource-editor';

export const metadata = { title: 'New resource' };

export default async function NewResourcePage() {
  const session = await requireSession();
  if (!can(session, 'resource:create')) notFound();

  return (
    <>
      <AdminPageHeader
        title="New resource"
        description="The thing someone exchanges an email address for. It saves as a draft."
      />
      <ResourceEditor
        initial={EMPTY_RESOURCE}
        canPublish={can(session, 'resource:publish')}
        canDelete={false}
      />
    </>
  );
}
