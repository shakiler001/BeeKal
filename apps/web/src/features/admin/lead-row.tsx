import Link from 'next/link';
import type { AdminLead } from '@beekal/contracts/admin';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';

const PROBLEM_LABELS: Record<string, string> = {
  'manual-work': 'Manual work',
  'disconnected-systems': 'Disconnected systems',
  'legacy-software': 'Legacy software',
  'ai-opportunity': 'AI opportunity',
  'new-product': 'New product',
  'not-sure': 'Not sure yet',
};

/**
 * A lead in the inbox. Sorted by score, so the founder's attention goes where
 * the scoring says it should — and the score is shown with its reasons a click
 * away, because an unexplainable number gets ignored.
 */
export function LeadRow({ lead }: { lead: AdminLead }) {
  const hot = lead.score >= 70;

  return (
    <Link href={`/admin/leads/${lead.id}`} className="block">
      <Card interactive padding="sm" className="flex flex-wrap items-center gap-4">
        <span
          className={cn(
            'tabular font-display grid size-11 flex-none place-items-center rounded-full text-[0.95rem] font-bold',
            hot ? 'bg-brand text-on-brand' : 'bg-bg-alt text-ink-2',
          )}
          title={hot ? 'High-scoring lead' : undefined}
        >
          {lead.score}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{lead.name}</span>
            {lead.company && <span className="text-ink-2 text-[0.9rem]">{lead.company}</span>}
          </span>
          <span className="text-ink-2 mt-0.5 block truncate text-[0.88rem]">
            {PROBLEM_LABELS[lead.problemArea] ?? lead.problemArea}
            {lead.source ? ` · ${lead.source}` : ''}
          </span>
        </span>

        <span className="text-ink-2 flex-none text-[0.8rem] font-semibold tracking-wide uppercase">
          {lead.stage.replace(/_/g, ' ').toLowerCase()}
        </span>
      </Card>
    </Link>
  );
}
