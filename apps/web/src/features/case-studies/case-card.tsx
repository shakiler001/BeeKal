import Link from 'next/link';
import { Card } from '@/components/ui';
import type { CaseStudy } from '@/content/case-studies';
import { IllustrativeBadge } from './illustrative-badge';

export function CaseCard({ caseStudy: c }: { caseStudy: CaseStudy }) {
  return (
    <Link href={`/work/${c.slug}`} className="block h-full">
      <Card interactive className="flex h-full flex-col">
        {c.isIllustrative && <IllustrativeBadge />}
        <h3 className="font-display mt-3 text-[1.2rem] leading-snug font-bold tracking-[-0.025em]">
          {c.title}
        </h3>
        <p className="text-ink-2 mt-2 text-[0.9rem]">{c.context}</p>
        <p className="mt-4 text-[0.98rem]">{c.problem}</p>

        <dl className="border-line-2 mt-auto grid gap-1 border-t pt-4">
          <dt className="sr">Result</dt>
          <dd className="text-brand tabular font-display text-[1.25rem] font-bold tracking-[-0.03em]">
            {c.results[0]?.value}
          </dd>
          <dd className="text-ink-2 text-[0.9rem]">{c.results[0]?.label}</dd>
        </dl>
      </Card>
    </Link>
  );
}
