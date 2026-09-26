import Link from 'next/link';
import type { Permission, Role } from '@beekal/contracts';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { RoleEditor } from '@/features/admin/role-editor';
import { notFound } from 'next/navigation';

export const metadata = { title: 'New role' };

const emptyRole: Role = {
  id: 'new',
  key: '',
  name: '',
  description: null,
  isSystem: false,
  isOwner: false,
  userCount: 0,
  grants: [],
};

export default async function NewRolePage() {
  const session = await requireSession();
  if (!can(session, 'role:create') || !can(session, 'role:read')) notFound();
  const permissions = await adminApi.get<Permission[]>('/access/permissions');

  return (
    <>
      <Link href="/admin/people" className="text-ink-2 hover:text-ink text-[0.9rem]">
        &larr; People
      </Link>
      <div className="mt-4 mb-8">
        <AdminPageHeader
          title="Create role"
          description="Choose the exact access this role should grant."
        />
      </div>
      <RoleEditor role={emptyRole} permissions={permissions} canEdit canDelete={false} />
    </>
  );
}
