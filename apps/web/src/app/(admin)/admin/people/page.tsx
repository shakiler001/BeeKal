import Link from 'next/link';
import type { AdminUser, Role } from '@beekal/contracts';
import { Card } from '@/components/ui';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';

export const metadata = { title: 'People' };

export default async function PeoplePage() {
  const session = await requireSession();

  const [users, roles] = await Promise.all([
    can(session, 'user:read') ? adminApi.get<AdminUser[]>('/users') : null,
    can(session, 'role:read') ? adminApi.get<Role[]>('/access/roles') : null,
  ]);

  return (
    <>
      <AdminPageHeader title="People" description="Who has access, and what each role can do." />

      {users && (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-lg font-bold tracking-tight">Users</h2>
          <Card padding="sm">
            <ul className="divide-line divide-y">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-ink-2 block text-[0.88rem]">{user.email}</span>
                  </span>
                  <span className="text-ink-2 text-[0.85rem]">
                    {user.roles.map((r) => r.name).join(', ')}
                  </span>
                  <span
                    className={
                      user.status === 'ACTIVE'
                        ? 'text-brand text-[0.78rem] font-bold tracking-wide uppercase'
                        : 'text-ink-2 text-[0.78rem] font-bold tracking-wide uppercase'
                    }
                  >
                    {user.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {roles && (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-lg font-bold tracking-tight">Roles</h2>
          <p className="text-ink-2 mb-4 max-w-[60ch] text-[0.95rem]">
            Roles are data, not code. Change what a role can do here and everyone holding it is
            updated on their next request.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <li key={role.id}>
                <Link href={`/admin/people/roles/${role.id}`} className="block h-full">
                  <Card interactive padding="sm" className="h-full">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-display font-semibold">{role.name}</span>
                      <span className="text-ink-2 tabular flex-none text-[0.82rem]">
                        {role.grants.length} permissions
                      </span>
                    </span>
                    {role.description && (
                      <span className="text-ink-2 mt-1.5 block text-[0.88rem]">
                        {role.description}
                      </span>
                    )}
                    <span className="text-ink-2 mt-2 block text-[0.82rem]">
                      {role.userCount === 0
                        ? 'No one holds this'
                        : `${role.userCount} ${role.userCount === 1 ? 'person' : 'people'}`}
                      {role.isOwner ? ' · protected' : ''}
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
