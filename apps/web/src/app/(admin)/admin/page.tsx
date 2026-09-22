import Link from 'next/link';
import type { AdminLead } from '@beekal/contracts';
import { Card } from '@/components/ui';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { LeadRow } from '@/features/admin/lead-row';

export const metadata = { title: 'Dashboard' };

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user: { name: string } | null;
}

export default async function AdminDashboard() {
  const session = await requireSession();

  // Only ask for what this user may see. Requesting data they cannot read and
  // catching the 403 would work, but it puts a forbidden request in the log on
  // every page view.
  const [leads, audit] = await Promise.all([
    can(session, 'lead:read')
      ? adminApi
          .get<{ items: AdminLead[]; total: number }>('/admin/leads?limit=5&sort=score')
          .catch(() => null)
      : null,
    can(session, 'audit:read')
      ? adminApi.get<AuditEntry[]>('/admin/audit').catch(() => null)
      : null,
  ]);

  return (
    <>
      <AdminPageHeader
        title={`Good to see you, ${session.name.split(' ')[0]}.`}
        description="What needs attention today."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {leads && (
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Leads by score
                <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">
                  {leads.total} total
                </span>
              </h2>
              <Link href="/admin/leads" className="text-brand text-[0.9rem] font-medium">
                See all
              </Link>
            </div>

            {leads.items.length === 0 ? (
              <Card>
                <p className="text-ink-2">
                  No leads yet. They appear here the moment someone submits the form.
                </p>
              </Card>
            ) : (
              <ul className="grid gap-2">
                {leads.items.map((lead) => (
                  <li key={lead.id}>
                    <LeadRow lead={lead} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {audit && (
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">Recent activity</h2>
              <Link href="/admin/audit" className="text-brand text-[0.9rem] font-medium">
                See all
              </Link>
            </div>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {audit.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="text-[0.9rem]">
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-ink-2"> · {entry.user?.name ?? 'system'}</span>
                    </span>
                    <time
                      dateTime={entry.createdAt}
                      className="text-ink-2 tabular flex-none text-[0.82rem]"
                    >
                      {new Date(entry.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>

      {!leads && !audit && (
        <Card className="mt-8">
          <p className="text-ink-2">
            Your role does not include the dashboard panels. Use the navigation above for what you
            do have access to.
          </p>
        </Card>
      )}
    </>
  );
}
