import type { ContentStatus } from '@beekal/contracts';
import { cn } from '@/lib/cn';

const STYLES: Record<ContentStatus, string> = {
  PUBLISHED: 'bg-brand text-on-brand',
  IN_REVIEW: 'bg-accent text-on-accent',
  DRAFT: 'bg-bg-alt text-ink-2 ring-1 ring-line',
  ARCHIVED: 'bg-bg-alt text-ink-2 ring-1 ring-line',
};

const LABELS: Record<ContentStatus, string> = {
  PUBLISHED: 'Live',
  IN_REVIEW: 'In review',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
};

export function StatusPill({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        'flex-none rounded-full px-2.5 py-1 text-[0.72rem] font-bold tracking-wide uppercase',
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
