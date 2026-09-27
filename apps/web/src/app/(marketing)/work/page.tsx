import type { Metadata } from 'next';
import { Section, SectionHeader, Wrap } from '@/components/ui';
import { getCaseStudies } from '@/lib/content/case-studies';
import { getSolutions } from '@/lib/content/solutions';
import { CaseCard } from '@/features/case-studies/case-card';

export const metadata: Metadata = {
  title: 'Work and Example Scenarios',
  description:
    'Explore the thinking behind Beekal work and illustrative scenarios, from the friction to a practical approach.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage() {
  const [caseStudies, solutions] = await Promise.all([getCaseStudies(), getSolutions()]);
  const solutionName = new Map(solutions.map((s) => [s.key, s.name]));
  const allIllustrative = caseStudies.length > 0 && caseStudies.every((c) => c.isIllustrative);
  const hasIllustrative = caseStudies.some((c) => c.isIllustrative);

  return (
    <Section tone="alt">
      <Wrap>
        <SectionHeader
          eyebrow="Work and examples"
          title="See the thinking behind each approach."
          lede="Start with the friction. Then see the system we would design around the work."
          headingLevel="h1"
        />

        {hasIllustrative && (
          <div className="border-line bg-surface mt-8 max-w-[64ch] rounded-[var(--r-sm)] border px-5 py-4 sm:px-6">
            <p className="text-ink text-[0.95rem] leading-relaxed">
              <strong>
                {allIllustrative
                  ? 'These are illustrative scenarios, not client results.'
                  : 'Marked scenarios are illustrative, not client results.'}
              </strong>{' '}
              They show proposed approaches; figures on their detail pages are hypothetical, not
              verified outcomes.
            </p>
          </div>
        )}

        <ul className="mt-10 grid gap-6 lg:grid-cols-2">
          {caseStudies.map((c) => (
            // The card is `h-full`, which resolves against the whole grid
            // item. With a label above it inside the same item, it was as tall
            // as the item AND pushed down by the label, so it overhung the row
            // and collided with the next row's label. The column makes the
            // label take its space and the card fill what is left.
            <li key={c.slug} className="flex flex-col">
              {/*
                The label is omitted rather than guessed when the category has
                been unpublished since the case study was written. A heading
                reading "undefined" is worse than no heading.
              */}
              {solutionName.has(c.solutionKey) && (
                <p className="text-ink-2 mb-3 text-[0.75rem] font-bold tracking-[0.09em] uppercase">
                  {solutionName.get(c.solutionKey)}
                </p>
              )}
              <div className="flex-1">
                <CaseCard caseStudy={c} />
              </div>
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}
