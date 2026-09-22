import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, Section, SectionHeader, Wrap } from '@/components/ui';
import { SOLUTIONS } from '@/content/solutions';

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'Five ways Beekal improves how you operate: Build, Modernize, Automate, AI and Care. Named, so you know what you are buying.',
  alternates: { canonical: '/solutions' },
};

export default function SolutionsPage() {
  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Solutions"
          title="Five ways we improve how you operate."
          lede="Not thirty services. Five, named — so you know what you are buying and we know what we are selling."
          headingLevel="h1"
        />

        <ul className="mt-10 grid gap-5 lg:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <li key={s.key}>
              <Link href={`/solutions/${s.slug}`} className="block h-full">
                <Card interactive padding="lg" className="h-full">
                  <h2 className="font-display text-[1.3rem] font-bold tracking-[-0.025em]">
                    <span className="text-ink-2 font-medium">Beekal </span>
                    <span className="text-brand">{s.name.replace('Beekal ', '')}</span>
                  </h2>
                  <p className="font-display mt-3 text-[1.05rem] leading-snug font-semibold">
                    {s.cardHeadline}
                  </p>
                  <p className="text-ink-2 mt-3">{s.cardBody}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}
