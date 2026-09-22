import type { AdminLead } from '@beekal/contracts';
import { Card } from '@/components/ui';
import { adminApi } from '@/lib/admin/api';
import { requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { LeadRow } from '@/features/admin/lead-row';

export const metadata = { title: 'Leads' };

export default async function LeadsPage() {
  const session = await requireSession();
  const scope = session.permissions['lead:read'];

  const data = await adminApi.get<{ items: AdminLead[]; total: number }>(
    '/admin/leads?limit=50&sort=score',
  );

  return (
    <>
      <AdminPageHeader
        title="Leads"
        description={
          scope === 'ASSIGNED'
            ? 'The leads assigned to you, highest score first.'
            : 'Everyone who has asked, highest score first.'
        }
      />

      {data.items.length === 0 ? (
        <Card className="mt-8">
          <p className="text-ink-2">
            {scope === 'ASSIGNED'
              ? 'Nothing is assigned to you yet.'
              : 'No leads yet. They appear here the moment someone submits the form.'}
          </p>
        </Card>
      ) : (
        <ul className="mt-8 grid gap-2">
          {data.items.map((lead) => (
            <li key={lead.id}>
              <LeadRow lead={lead} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
