import type { Metadata } from 'next';
import { Section, SectionHeader, Wrap } from '@/components/ui';
import { CASE_STUDIES } from '@/content/case-studies';
import { SOLUTION_BY_KEY } from '@/content/solutions';
import { CaseCard } from '@/features/case-studies/case-card';

export const metadata: Metadata = {
  title: 'Case Studies',
  description:
    'Every Beekal case study answers the same eight questions, including the one most agencies leave out: what we would do differently.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  const allIllustrative = CASE_STUDIES.every((c) => c.isIllustrative);

  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Case studies"
          title="Proof means results, not screenshots."
          lede="Every Beekal case answers the same eight questions, including the one most agencies leave out: what we would do differently."
          headingLevel="h1"
        />

        {allIllustrative && (
          <p className="border-accent bg-bg-alt text-ink-2 mt-8 max-w-[62ch] border-l-4 py-4 pl-5 text-[0.95rem] leading-relaxed">
            <strong className="text-ink">These are example scenarios, not client results.</strong>{' '}
            They show the format every Beekal case study follows, and the kind of problem we take
            on. Real, named cases replace them as clients approve — we do not publish a client
            result without written permission, and we do not invent one to fill the gap.
          </p>
        )}

        <ul className="mt-10 grid gap-5 lg:grid-cols-2">
          {CASE_STUDIES.map((c) => (
            // The card is `h-full`, which resolves against the whole grid
            // item. With a label above it inside the same item, it was as tall
            // as the item AND pushed down by the label, so it overhung the row
            // and collided with the next row's label. The column makes the
            // label take its space and the card fill what is left.
            <li key={c.slug} className="flex flex-col">
              <p className="text-ink-2 mb-2 text-[0.8rem] font-bold tracking-[0.09em] uppercase">
                {SOLUTION_BY_KEY[c.solutionKey].name}
              </p>
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
