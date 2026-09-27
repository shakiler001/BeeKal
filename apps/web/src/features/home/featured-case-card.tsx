import Link from 'next/link';
import type { CaseStudy } from '@/content/case-studies';

/** A short homepage preview; the full case page carries the detailed evidence. */
export function FeaturedCaseCard({ caseStudy: c }: { caseStudy: CaseStudy }) {
  return (
    <Link
      href={`/work/${c.slug}`}
      className="border-line bg-surface hover:border-brand group flex h-full flex-col rounded-[var(--r-md)] border p-6 transition-colors sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="bg-brand-soft text-brand rounded-md px-2.5 py-1 text-[0.7rem] leading-none font-bold tracking-[0.08em] uppercase">
          {c.isIllustrative ? 'Example scenario' : 'Client story'}
        </span>
        <span className="text-ink-2 text-[0.82rem] leading-snug">{c.clientName ?? c.context}</span>
      </div>

      <h3 className="font-display mt-5 max-w-[28ch] text-[clamp(1.28rem,1.15rem+0.45vw,1.52rem)] leading-[1.25] font-semibold tracking-[-0.025em]">
        {c.title}
      </h3>

      <div className="border-line mt-6 grid gap-5 border-t pt-5 sm:grid-cols-2 sm:gap-6">
        <div>
          <p className="text-ink-2 text-[0.72rem] font-bold tracking-[0.08em] uppercase">
            The friction
          </p>
          <p className="mt-2 text-[0.94rem] leading-[1.5]">{c.beforeLead}</p>
        </div>
        <div>
          <p className="text-ink-2 text-[0.72rem] font-bold tracking-[0.08em] uppercase">
            {c.isIllustrative ? 'Proposed approach' : 'The approach'}
          </p>
          <p className="mt-2 line-clamp-3 text-[0.94rem] leading-[1.5]">{c.whatChanged}</p>
        </div>
      </div>

      <span className="text-brand mt-auto inline-flex items-center gap-2 pt-7 text-[0.9rem] font-semibold">
        Explore the thinking
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}
