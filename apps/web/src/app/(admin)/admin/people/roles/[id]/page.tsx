import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Permission, Role } from '@beekal/contracts';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { RoleEditor } from '@/features/admin/role-editor';

export const metadata = { title: 'Role' };

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const [roles, permissions] = await Promise.all([
    adminApi.get<Role[]>('/access/roles'),
    adminApi.get<Permission[]>('/access/permissions'),
  ]);

  const role = roles.find((r) => r.id === id);
  if (!role) notFound();

  return (
    <>
      <Link href="/admin/people" className="text-ink-2 hover:text-ink text-[0.9rem]">
        &larr; People
      </Link>

      <div className="mt-4 mb-8">
        <AdminPageHeader
          title={role.name}
          description={
            can(session, 'role:update')
              ? 'Tick what this role may do. The summary on the right says it in plain English.'
              : 'You can see this role but not change it.'
          }
        />
      </div>

      <RoleEditor role={role} permissions={permissions} canEdit={can(session, 'role:update')} />
    </>
  );
}
