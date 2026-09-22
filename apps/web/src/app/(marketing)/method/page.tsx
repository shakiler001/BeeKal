import Link from 'next/link';
import type { Metadata } from 'next';
import { Bridge } from '@/components/patterns';
import { Button, Card, Section, SectionHeader, Wrap } from '@/components/ui';
import { METHOD } from '@/content/site';

export const metadata: Metadata = {
  title: 'How We Work',
  description:
    'Understand, Simplify, Systemize, Automate, Improve. Beekal understands the business before building anything — and publishes the method so clients can hold us to it.',
  alternates: { canonical: '/method' },
};

const ENGAGEMENT = [
  {
    title: 'Scope, in writing',
    body: 'What is included, what is not, and what happens when something changes. Agreed before work starts.',
  },
  {
    title: 'Milestones that ship',
    body: 'Each one delivers working software you can use, not a status report you have to read.',
  },
  {
    title: 'One named person',
    body: 'You talk to the person doing the thinking. Not an account manager relaying messages.',
  },
  {
    title: 'Documentation as you go',
    body: 'Written while it is fresh, not reconstructed at the end when nobody remembers why.',
  },
  {
    title: 'You own everything',
    body: 'Code, accounts, infrastructure, documentation. From day one, not on request.',
  },
  {
    title: 'A plan for after launch',
    body: 'Support and improvement discussed before go-live, so nothing is abandoned at the finish line.',
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
          />

          <ol className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {METHOD.map((step) => (
              <li key={step.n}>
                <Card className="h-full">
                  <span className="text-brand tabular font-display text-[1.8rem] leading-none font-extrabold">
                    {step.n}
                  </span>
                  <h2 className="font-display mt-3 text-lg font-bold tracking-tight">
                    {step.name}
                  </h2>
                  <p className="text-ink-2 mt-2 text-[0.95rem] leading-relaxed">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
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

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENGAGEMENT.map((e) => (
              <li key={e.title}>
                <Card className="h-full">
                  <h3 className="font-display font-bold tracking-tight">{e.title}</h3>
                  <p className="text-ink-2 mt-2 text-[0.95rem] leading-relaxed">{e.body}</p>
                </Card>
              </li>
            ))}
          </ul>
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
              <Button asChild>
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
