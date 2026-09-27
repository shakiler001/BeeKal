import Link from 'next/link';
import type { Metadata } from 'next';
import { Bridge } from '@/components/patterns';
import { Button, Section, SectionHeader, Wrap } from '@/components/ui';
import { MethodFlow } from '@/features/method/method-flow';

export const metadata: Metadata = {
  title: 'How We Work',
  description:
    'Understand, Simplify, Systemize, Automate, Improve. Beekal understands the business before building anything — and publishes the method so clients can hold us to it.',
  alternates: { canonical: '/method' },
};

const ENGAGEMENT = [
  {
    label: 'Clear agreements',
    items: [
      {
        title: 'Scope, in writing',
        body: 'What is included, what is not, and what happens when something changes. Agreed before work starts.',
      },
      {
        title: 'One named person',
        body: 'You talk to the person doing the thinking. Not an account manager relaying messages.',
      },
    ],
  },
  {
    label: 'Working delivery',
    items: [
      {
        title: 'Milestones that ship',
        body: 'Each one delivers working software you can use, not a status report you have to read.',
      },
      {
        title: 'Documentation as you go',
        body: 'Written while it is fresh, not reconstructed at the end when nobody remembers why.',
      },
    ],
  },
  {
    label: 'Control after launch',
    items: [
      {
        title: 'You own everything',
        body: 'Code, accounts, infrastructure, documentation. From day one, not on request.',
      },
      {
        title: 'A plan for after launch',
        body: 'Support and improvement discussed before go-live, so nothing is abandoned at the finish line.',
      },
    ],
  },
];

export default function MethodPage() {
  return (
    <>
      <Section>
        <Wrap>
          <SectionHeader
            eyebrow="How we work"
            title="We understand the business before we build anything."
            lede="Technology is a means, not the product. Jumping to code before the real problem is understood is the most common and most expensive mistake in this industry."
            headingLevel="h1"
            className="max-w-[65ch]"
          />

          <MethodFlow />
        </Wrap>
      </Section>

      <Section tone="alt">
        <Wrap>
          <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
            How an engagement runs
          </h2>
          <p className="text-ink-2 mt-3 max-w-[56ch]">
            Software projects go wrong in predictable ways. These are the six habits that prevent
            most of them.
          </p>

          <ol className="border-line bg-line mt-8 grid gap-px overflow-hidden rounded-[var(--r-lg)] border lg:grid-cols-3">
            {ENGAGEMENT.map((group, index) => (
              <li key={group.label} className="bg-surface p-6 sm:p-7">
                <span className="text-brand tabular text-[0.75rem] font-bold tracking-[0.09em] uppercase">
                  {String(index + 1).padStart(2, '0')} / {group.label}
                </span>
                <ul className="mt-6 space-y-6">
                  {group.items.map((item) => (
                    <li key={item.title}>
                      <h3 className="font-display text-[1.02rem] font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-ink-2 mt-2 text-[0.94rem] leading-[1.55]">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="max-w-[26ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
                The method starts with an assessment.
              </h2>
              <p className="text-ink-2 mt-4 max-w-[52ch]">
                Understand comes first because everything downstream depends on getting it right.
                The Business System Assessment is that step, done properly and written down.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild className="font-display rounded-[var(--r-sm)]">
                <Link href="/assessment">How the assessment works</Link>
              </Button>
            </div>
          </div>

          <Bridge href="/about" label="Who you work with">
            The person who would actually run your project.
          </Bridge>
        </Wrap>
      </Section>
    </>
  );
}
