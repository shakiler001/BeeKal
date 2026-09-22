import type { Metadata } from 'next';
import { Section, SectionHeader, Wrap } from '@/components/ui';
import { ScoreTool } from '@/features/score/score-tool';

export const metadata: Metadata = {
  title: 'Business System Maturity Score',
  description:
    'Nine questions, two minutes. Find out which of the five maturity levels your business is on, where it is weakest, and what to look at first. Free, no email required.',
  alternates: { canonical: '/score' },
};

export default function ScorePage() {
  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Free tool"
          title="How mature is your business system?"
          lede="Nine questions. Move each slider to match your business today. Nothing is sent and no email is required to see your result."
          headingLevel="h1"
        />

        <noscript>
          <p className="border-accent bg-bg-alt mt-8 border-l-4 py-4 pl-5">
            This tool needs JavaScript to calculate your level. Everything else on the site works
            without it.
          </p>
        </noscript>

        <div className="mt-12">
          <ScoreTool />
        </div>
      </Wrap>
    </Section>
  );
}
