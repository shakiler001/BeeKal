import { Card } from '@/components/ui';
import { adminApi } from '@/lib/admin/api';
import { requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';

export const metadata = { title: 'Audit' };

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export default async function AuditPage() {
  await requireSession();
  const entries = await adminApi.get<AuditEntry[]>('/admin/audit');

  return (
    <>
      <AdminPageHeader
        title="Audit"
        description="Every change, who made it, and when. Append-only — nothing here can be edited or removed."
      />

      <Card padding="sm" className="mt-8">
        <ul className="divide-line divide-y">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
              <span className="font-medium">{entry.action}</span>
              <span className="text-ink-2 text-[0.88rem]">{entry.entityType}</span>
              <span className="text-ink-2 ml-auto text-[0.88rem]">
                {entry.user?.name ?? 'system'}
              </span>
              <time
                dateTime={entry.createdAt}
                className="text-ink-2 tabular flex-none text-[0.82rem]"
              >
                {new Date(entry.createdAt).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </time>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
