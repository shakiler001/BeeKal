import Link from 'next/link';
import type { Metadata } from 'next';
import { Bridge } from '@/components/patterns';
import { Accordion, Button, Card, Dots, Section, SectionHeader, Wrap } from '@/components/ui';
import { CheckIcon } from '@/components/brand';
import { ASSESSMENT } from '@/content/site';
import { getFaqs } from '@/lib/content/faqs';
import { assessmentServiceSchema, faqSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Business System Assessment',
  description:
    'A paid, structured diagnosis of how your business actually runs. Two to three weeks, about six hours of your time, eleven documents you keep — whoever builds the fix.',
  alternates: { canonical: '/assessment' },
};

/**
 * The money page, and the only page allowed to be long — a buyer reading it is
 * already considering a purchase, and here length signals thoroughness.
 *
 * Section order follows $100M Offers: problem, outcome, mechanism, proof, risk
 * reversal, ask (docs/02 section 3.2).
 */

const ROADMAP_SAMPLE = [
  {
    when: 'Fix first',
    what: 'Remove double entry between sales and finance',
    impact: 4,
    effort: 2,
  },
  { when: 'Then', what: 'Sync approvals between email and the ERP', impact: 4, effort: 3 },
  { when: 'Next', what: 'Automate month-end reporting', impact: 3, effort: 2 },
  { when: 'Later', what: 'Modernize the legacy order module', impact: 5, effort: 4 },
];

const WEEKS = [
  {
    label: 'Week 1',
    title: 'Understand',
    body: 'Interviews with the people who do the work, a walkthrough of every system, and a first pass at the process map. You review the current-state map before we go further — so value arrives before the end.',
  },
  {
    label: 'Week 2',
    title: 'Analyse',
    body: 'We trace the data, count where time actually goes, and separate the problems that are painful from the problems that are expensive. Mostly without you in the room.',
  },
  {
    label: 'Week 3',
    title: 'Decide',
    body: 'The roadmap, ranked by impact against effort, with phases and investment levels. We walk through it together and you leave owning every document.',
  },
];

export default async function AssessmentPage() {
  // The visible list and the FAQPage structured data come from the same rows,
  // so the markup and the page cannot disagree.
  const faqs = await getFaqs('assessment');
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(assessmentServiceSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
      />

      <Section>
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="The first step"
                title="See what to fix first, before you spend on building."
                lede={ASSESSMENT.lede}
                headingLevel="h1"
                className="max-w-none"
              />
              <p className="text-ink-2 mt-5 max-w-[52ch] leading-relaxed">
                It is a paid, structured engagement with real documents at the end. You leave with a
                clear map of how the business runs today, and a roadmap you own — whoever builds it.
              </p>

              <dl className="border-line mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-8 sm:grid-cols-4">
                <Fact label="Duration" value={ASSESSMENT.duration} />
                <Fact label="Your time" value={ASSESSMENT.clientHours} />
                <Fact label="Price" value={ASSESSMENT.priceRange || 'Fixed, agreed first'} />
                <Fact label="You receive" value={`${ASSESSMENT.documentCount} documents`} />
              </dl>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild className="font-display rounded-[var(--r-sm)]">
                  <Link href="/contact?intent=assessment">Request an assessment</Link>
                </Button>
                <span className="text-ink-2 text-[0.92rem]">{ASSESSMENT.riskReversal[0]}</span>
              </div>
            </div>

            {/* Proof of format: what a deliverable actually looks like. */}
            <Card padding="none" className="overflow-hidden">
              <div className="border-line bg-bg-alt flex flex-wrap items-end justify-between gap-3 border-b px-6 py-5">
                <span>
                  <span className="text-brand block text-[0.72rem] font-bold tracking-[0.09em] uppercase">
                    Sample deliverable
                  </span>
                  <strong className="font-display mt-1 block text-[1.08rem] font-semibold">
                    Prioritized roadmap
                  </strong>
                </span>
                <small className="text-ink-2 text-[0.76rem]">
                  Illustrative format, not client data
                </small>
              </div>
              {ROADMAP_SAMPLE.map((row, i) => (
                <div
                  key={row.what}
                  className={`grid gap-2 px-6 py-4 ${i > 0 ? 'border-line border-t' : ''}`}
                >
                  <span className="text-brand text-[0.78rem] font-bold tracking-[0.08em] uppercase">
                    {row.when}
                  </span>
                  <span className="font-medium">{row.what}</span>
                  <span className="text-ink-2 flex flex-wrap gap-x-6 gap-y-1 text-[0.85rem]">
                    <span className="flex items-center gap-2">
                      Impact <Dots value={row.impact} label="Impact" />
                    </span>
                    <span className="flex items-center gap-2">
                      Effort <Dots value={row.effort} label="Effort" />
                    </span>
                  </span>
                </div>
              ))}
              <p className="border-line text-ink-2 border-t px-6 py-3 text-[0.85rem]">
                Every item is ranked by impact and effort, so you know what to do first.
              </p>
            </Card>
          </div>
        </Wrap>
      </Section>

      {/* What we examine / what you receive */}
      <Section tone="alt">
        <Wrap>
          <SectionHeader
            eyebrow="Scope and outputs"
            title="A map of the work. A plan you own."
            lede="We look across the operation, then turn what we find into decisions you can act on."
            className="max-w-[62ch]"
          />

          <div className="border-line bg-surface mt-9 rounded-[var(--r-md)] border p-6 sm:p-8">
            <h3 className="font-display text-[1.18rem] font-semibold tracking-tight">
              What we examine
            </h3>
            <p className="text-ink-2 mt-2 text-[0.94rem] leading-relaxed">
              Nothing is assumed. These are the areas we check with your team.
            </p>
            <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {ASSESSMENT.examines.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.94rem] leading-snug">
                  <span
                    aria-hidden="true"
                    className="bg-accent mt-[0.45em] size-1.5 flex-none rounded-full"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
              The {ASSESSMENT.documentCount} documents you keep
            </h2>
            <p className="text-ink-2 mt-3 max-w-[60ch] leading-relaxed">
              Each answers a decision. They stay yours, whoever builds the fix.
            </p>
            <ol aria-label="Assessment documents" className="mt-7 grid gap-x-10 sm:grid-cols-2">
              {ASSESSMENT.deliverables.map((deliverable, index) => (
                <li key={deliverable.name} className="border-line flex gap-4 border-t py-4">
                  <span className="text-brand tabular w-7 flex-none text-[0.78rem] font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <strong className="font-display block text-[0.96rem] leading-snug font-semibold">
                      {deliverable.name}
                    </strong>
                    <span className="text-ink-2 mt-1 block text-[0.89rem] leading-relaxed">
                      {deliverable.answers}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Wrap>
      </Section>

      {/* How the weeks run */}
      <Section>
        <Wrap>
          <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
            How the two to three weeks actually run
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-3">
            {WEEKS.map((w) => (
              <li key={w.label}>
                <Card className="h-full">
                  <span className="text-brand text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                    {w.label}
                  </span>
                  <h3 className="font-display mt-2 text-lg font-bold tracking-tight">{w.title}</h3>
                  <p className="text-ink-2 mt-3 text-[0.95rem] leading-relaxed">{w.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Wrap>
      </Section>

      {/* Risk reversal */}
      <Section tone="band">
        <Wrap>
          <h2 className="max-w-[24ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
            What you are not signing up for.
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {ASSESSMENT.riskReversal.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <CheckIcon className="text-accent mt-0.5 size-5 flex-none" />
                <span className="text-white/90">{r}</span>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* FAQ — booking objections */}
      <Section>
        <Wrap>
          <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
            Questions people ask before they book
          </h2>
          <div className="mt-8 max-w-[72ch]">
            {faqs.map((f, i) => (
              <Accordion key={f.question} summary={f.question} defaultOpen={i === 0}>
                <p>{f.answer}</p>
              </Accordion>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild className="font-display rounded-[var(--r-sm)]">
              <Link href="/contact?intent=assessment">Request an assessment</Link>
            </Button>
            <span className="text-ink-2 text-[0.92rem]">
              Or{' '}
              <Link href="/contact?intent=talk" className="text-ink underline underline-offset-4">
                just describe the problem
              </Link>{' '}
              and we will tell you what we would ask first.
            </span>
          </div>

          <Bridge href="/method">Before you commit to anyone, see how the work runs.</Bridge>
        </Wrap>
      </Section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-2 text-[0.82rem] font-semibold tracking-[0.06em] uppercase">
        {label}
      </dt>
      <dd className="font-display tabular mt-1 text-[1.05rem] font-semibold">{value}</dd>
    </div>
  );
}
