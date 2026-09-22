import Link from 'next/link';
import type { Metadata } from 'next';
import { Bridge } from '@/components/patterns';
import { Button, Card, Eyebrow, Section, SectionHeader, Tag, Wrap } from '@/components/ui';
import { CheckIcon } from '@/components/brand';
import { HeroStage } from '@/features/hero-stage/hero-stage';
import { ASSESSMENT, BEFORE_AFTER, SITE } from '@/content/site';
import { PROBLEMS } from '@/content/problems';
import { SOLUTIONS } from '@/content/solutions';
import { FEATURED_CASES } from '@/content/case-studies';
import { CaseCard } from '@/features/case-studies/case-card';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * The homepage is a router, not a brochure.
 *
 * Budget: ~550 visible words. The demo had roughly 3,100 on one page. Long-form
 * content lives on the pages it belongs to; this page's job is to make a
 * visitor think "that is us" in eight seconds, then send them somewhere that
 * finishes the argument (docs/02 section 3.1).
 */
export default function HomePage() {
  return (
    <>
      <Section className="pt-[clamp(32px,4vw,56px)]">
        <Wrap>
          <div className="grid items-center gap-[clamp(32px,5vw,64px)] lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="text-heading text-[clamp(2.3rem,1.6rem+3.4vw,4.1rem)] leading-[1.05] font-extrabold tracking-[-0.045em]">
                Stop running six systems to run one business.
              </h1>
              <p className="text-ink-2 mt-5 max-w-[52ch] text-[clamp(1.05rem,1rem+0.4vw,1.25rem)] leading-relaxed">
                We turn scattered spreadsheets, chats and old software into one connected system —
                through custom software, automation and AI. Growth stops meaning more chaos.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/contact?intent=assessment">Request an assessment</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/contact?intent=talk">Describe your problem</Link>
                </Button>
              </div>
            </div>

            <HeroStage />
          </div>

          <div className="mt-[clamp(40px,5vw,72px)] grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <blockquote className="border-accent border-l-4 pl-5">
              <q className="font-display block text-[clamp(1.15rem,1rem+0.7vw,1.5rem)] leading-snug font-semibold tracking-[-0.02em]">
                We have software everywhere, but running the business is still difficult.
              </q>
              <span className="text-ink-2 mt-2 block text-[0.98rem]">
                If that sounds familiar, you are who we build for.
              </span>
            </blockquote>

            <ul className="text-ink-2 grid gap-2.5 text-[0.95rem]">
              <li>{SITE.locationLong}</li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {SITE.email}
                </a>
              </li>
              <li>
                Founder-led. {SITE.founderName.split(' ')[0]} replies {SITE.replyTime}.
              </li>
            </ul>
          </div>
        </Wrap>
      </Section>

      {/* ---------- Problems: self-identify, then route ---------- */}
      <Section tone="alt" id="problems">
        <Wrap>
          <SectionHeader
            eyebrow="What we fix"
            title="Every project starts with the problem, not the technology."
            lede="Pick the one that sounds like your week."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p) => (
              <li key={p.key}>
                <Link href={`/problems/${p.slug}`} className="block h-full">
                  <Card interactive className="h-full">
                    <p className="font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.015em]">
                      {p.cardHeadline}
                    </p>
                    <p className="text-brand mt-2 font-semibold">{p.cardAnswer}</p>
                    <p className="text-ink-2 mt-2 text-[0.95rem]">{p.cardBody}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      {/* ---------- The transformation, shown not claimed ---------- */}
      <Section tone="band">
        <Wrap>
          <Eyebrow>The difference</Eyebrow>
          <h2 className="max-w-[24ch] text-[clamp(1.75rem,1.3rem+2vw,2.6rem)] leading-[1.12] font-bold tracking-[-0.035em]">
            What changes when the business runs as one system.
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-[0.78rem] font-bold tracking-[0.09em] text-white/60 uppercase">
                Before
              </h3>
              <ul className="mt-4 space-y-2.5">
                {BEFORE_AFTER.before.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-white/75">
                    <span
                      aria-hidden
                      className="mt-2.5 size-1.5 flex-none rounded-full bg-white/40"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-accent text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                After
              </h3>
              <ul className="mt-4 space-y-2.5">
                {BEFORE_AFTER.after.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <CheckIcon className="text-accent mt-0.5 size-5 flex-none" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Wrap>
      </Section>

      {/* ---------- Solutions ---------- */}
      <Section id="solutions">
        <Wrap>
          <SectionHeader
            eyebrow="Solutions"
            title="Five ways we improve how you operate."
            lede="Named, so you know what you are buying — and so we know what we are selling."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <li key={s.key}>
                <Link href={`/solutions/${s.slug}`} className="block h-full">
                  <Card interactive className="h-full">
                    <h3 className="font-display text-[1.15rem] font-bold tracking-[-0.02em]">
                      <span className="text-ink-2 font-medium">Beekal </span>
                      <span className="text-brand">{s.name.replace('Beekal ', '')}</span>
                    </h3>
                    <p className="font-display mt-3 leading-snug font-semibold">{s.cardHeadline}</p>
                    <p className="text-ink-2 mt-2 text-[0.95rem]">{s.cardBody}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <Bridge href="/assessment">
            Before you commit to anyone, see what should be fixed first.
          </Bridge>
        </Wrap>
      </Section>

      {/* ---------- Assessment teaser ---------- */}
      <Section tone="alt">
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <SectionHeader
                eyebrow="The first step"
                title="See what to fix first, before you spend on building."
                lede={ASSESSMENT.lede}
              />
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild>
                  <Link href="/assessment">How the assessment works</Link>
                </Button>
                <span className="text-ink-2 text-[0.92rem]">{ASSESSMENT.riskReversal[0]}</span>
              </div>
            </div>

            <Card padding="lg">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Fact label="Duration" value={ASSESSMENT.duration} />
                <Fact label="Your time" value={ASSESSMENT.clientHours} />
                <Fact label="Price" value={ASSESSMENT.priceRange || 'Fixed, agreed first'} />
                <Fact label="You receive" value={`${ASSESSMENT.documentCount} documents`} />
              </dl>
              <ul className="mt-6 flex flex-wrap gap-2">
                {ASSESSMENT.examines.slice(0, 6).map((e) => (
                  <Tag key={e}>{e}</Tag>
                ))}
                <Tag>+{ASSESSMENT.examines.length - 6} more</Tag>
              </ul>
            </Card>
          </div>
        </Wrap>
      </Section>

      {/* ---------- Proof ---------- */}
      <Section>
        <Wrap>
          <SectionHeader
            eyebrow="Case studies"
            title="Proof means results, not screenshots."
            lede="Every Beekal case answers the same eight questions, including the one most agencies leave out: what we would do differently."
          />

          <ul className="mt-10 grid gap-5 lg:grid-cols-2">
            {FEATURED_CASES.map((c) => (
              <li key={c.slug}>
                <CaseCard caseStudy={c} />
              </li>
            ))}
          </ul>

          <Bridge href="/work" label="All work">
            Read every case study, including the ones that taught us something.
          </Bridge>
        </Wrap>
      </Section>

      {/* ---------- Score teaser ---------- */}
      <Section tone="alt">
        <Wrap>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <SectionHeader
              eyebrow="Free tool"
              title="How mature is your business system?"
              lede="Nine questions, two minutes. You get your level, your weakest dimensions and where to look first. No email required to see the result."
            />
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild variant="ghost">
                <Link href="/score">Score your business</Link>
              </Button>
            </div>
          </div>
        </Wrap>
      </Section>

      {/* ---------- Final CTA ---------- */}
      <Section tone="band">
        <Wrap>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <Eyebrow>Start here</Eyebrow>
              <h2 className="max-w-[22ch] text-[clamp(1.75rem,1.3rem+2vw,2.6rem)] leading-[1.12] font-bold tracking-[-0.035em]">
                Find what is slowing your business down.
              </h2>
              <p className="mt-4 max-w-[46ch] text-white/80">
                Tell us what you are trying to fix. We will say whether an assessment is the right
                first step — or if it is not.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild variant="accent">
                <Link href="/contact?intent=assessment">Request an assessment</Link>
              </Button>
            </div>
          </div>
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
