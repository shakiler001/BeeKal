import Link from 'next/link';
import type { Metadata } from 'next';
import { Button, Card, Section, SectionHeader, Wrap } from '@/components/ui';
import { BeeMark } from '@/components/brand';
import { RISKS, SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'About Beekal',
  description:
    'Beekal is a business technology transformation company in Dhaka. Founder-led, outcome-first, and honest about what does not work. Here is how we manage the risks buyers actually worry about.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const firstName = SITE.founderName.split(' ')[0];

  return (
    <>
      <Section>
        <Wrap>
          <SectionHeader
            eyebrow="Who you work with"
            title="We build the business behind the business."
            lede="Beekal is a business technology transformation company. We design and build the software, automation and AI systems that make growing businesses easier to operate and easier to scale."
            headingLevel="h1"
          />

          {/* TODO: replace the initials mark with a real photo of the founder. */}
          <Card padding="lg" className="mt-12 max-w-[72ch]">
            <div className="flex flex-wrap items-center gap-5">
              <span className="bg-brand-soft grid size-20 flex-none place-items-center rounded-full">
                <BeeMark title={null} className="h-10 w-auto" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">
                  {SITE.founderName}
                </h2>
                <p className="text-ink-2">{SITE.founderRole}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 leading-relaxed">
              <p>
                Beekal exists because of a sentence we kept hearing: &ldquo;We have software
                everywhere, but running the business is still difficult.&rdquo; That is not a
                software problem. It is what happens when people, processes and systems are each
                solved separately and never joined up.
              </p>
              <p>
                You talk to the person doing the thinking, not an account manager relaying messages.{' '}
                {firstName} replies {SITE.replyTime}, and will tell you when an assessment is not
                the right next step — that conversation is cheaper for both of us than the wrong
                project.
              </p>
            </div>
          </Card>
        </Wrap>
      </Section>

      <Section tone="alt" id="risk">
        <Wrap>
          <SectionHeader
            eyebrow="Risk"
            title="Software projects go wrong in predictable ways. We plan for each one."
            lede="These are the nine things buyers tell us they are afraid of, and what we do about each."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RISKS.map((r) => (
              <li key={r.fear}>
                <Card className="h-full">
                  <h3 className="font-display text-ink-2 text-[0.95rem] font-semibold">
                    &ldquo;{r.fear}&rdquo;
                  </h3>
                  <p className="mt-2 leading-snug">{r.answer}</p>
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
                The cheapest way to find out if we fit is to tell us the problem.
              </h2>
              <p className="text-ink-2 mt-4 max-w-[52ch]">
                No pitch deck, and no discovery call that is really a sales call. Describe what is
                slowing you down and we will tell you what we would ask next.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild>
                <Link href="/contact?intent=talk">Describe your problem</Link>
              </Button>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
