import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { AdminLead } from '@beekal/contracts';
import { Card } from '@/components/ui';
import { adminApi, ApiError } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { LeadStageControl } from '@/features/admin/lead-stage-control';

export const metadata = { title: 'Lead' };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  let lead: AdminLead;
  try {
    lead = await adminApi.get<AdminLead>(`/admin/leads/${id}`);
  } catch (error) {
    // Out of scope reads as not-found, deliberately: a 403 would confirm the
    // record exists to someone who may not act on it.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <Link href="/admin/leads" className="text-ink-2 hover:text-ink text-[0.9rem]">
        &larr; All leads
      </Link>

      <div className="mt-4">
        <AdminPageHeader
          title={lead.name}
          description={[lead.company, lead.email].filter(Boolean).join(' · ')}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">
              What they said
            </h2>
            <p className="mt-3 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
          </Card>

          {lead.scoreReasons && lead.scoreReasons.length > 0 && (
            <Card>
              <h2 className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                Why it scored {lead.score}
              </h2>
              <ul className="divide-line mt-3 divide-y">
                {lead.scoreReasons.map((reason) => (
                  <li
                    key={reason.factor}
                    className="flex items-baseline justify-between gap-4 py-2"
                  >
                    <span className="text-[0.95rem]">{reason.detail}</span>
                    <span className="text-brand tabular flex-none font-semibold">
                      +{reason.points}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="grid gap-6">
          <Card>
            <h2 className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">
              Details
            </h2>
            <dl className="mt-3 grid gap-2.5 text-[0.95rem]">
              <Detail label="Intent" value={lead.intent} />
              <Detail label="Problem area" value={lead.problemArea.replace(/-/g, ' ')} />
              <Detail label="Source" value={lead.source ?? 'direct'} />
              {lead.utmSource && <Detail label="Campaign" value={lead.utmSource} />}
              <Detail
                label="Received"
                value={new Date(lead.createdAt).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
              <Detail
                label="Marketing consent"
                value={lead.marketingConsent ? 'Yes — sequences allowed' : 'No — reply only'}
              />
            </dl>

            {!lead.marketingConsent && (
              <p className="border-accent bg-bg-alt text-ink-2 mt-4 border-l-2 py-2 pl-3 text-[0.85rem]">
                They agreed to a reply, not to marketing. Do not add them to a sequence.
              </p>
            )}
          </Card>

          {can(session, 'lead:update') && <LeadStageControl leadId={lead.id} stage={lead.stage} />}
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}
