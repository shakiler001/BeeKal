import Link from 'next/link';
import type { Metadata } from 'next';
import { Bridge } from '@/components/patterns';
import { Button, Eyebrow, Section, SectionHeader, Wrap } from '@/components/ui';
import { HeroStage } from '@/features/hero-stage/hero-stage';
import { ProblemSignals } from '@/features/home/problem-signals';
import { DecisionPath } from '@/features/home/decision-path';
import { ASSESSMENT, SITE } from '@/content/site';
import { getProblems } from '@/lib/content/problems';
import { getSolutions } from '@/lib/content/solutions';
import { getFeaturedCaseStudies } from '@/lib/content/case-studies';
import { CaseCard } from '@/features/case-studies/case-card';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * The homepage helps a buyer recognize a symptom, understand the decision path,
 * then choose a deeper page. The hero keeps the legacy Today/Tomorrow graphic;
 * the sections below give different information instead of repeating it.
 */
export default async function HomePage() {
  const [featuredCases, solutions, problems] = await Promise.all([
    getFeaturedCaseStudies(),
    getSolutions(),
    getProblems(),
  ]);

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

      <ProblemSignals problems={problems} />
      <DecisionPath assessment={ASSESSMENT} solutions={solutions} />

      <Section tone="alt" id="proof">
        <Wrap>
          <SectionHeader
            eyebrow="See the work"
            title="Judge the thinking, not the screenshots."
            lede="See the choices and what we would do differently."
          />

          <ul className="mt-10 grid gap-5 lg:grid-cols-2">
            {featuredCases.map((caseStudy) => (
              <li key={caseStudy.slug}>
                <CaseCard caseStudy={caseStudy} />
              </li>
            ))}
          </ul>

          <Bridge href="/work" label="All work">
            Read every case study, including the ones that taught us something.
          </Bridge>
        </Wrap>
      </Section>

      <Section tone="band">
        <Wrap>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <Eyebrow>Start here</Eyebrow>
              <h2 className="max-w-[22ch] text-[clamp(1.75rem,1.3rem+2vw,2.6rem)] leading-[1.12] font-bold tracking-[-0.035em]">
                Find what is slowing your business down.
              </h2>
              <p className="mt-4 max-w-[46ch] text-white/80">
                Tell us the bottleneck. We will say if an Assessment makes sense.
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
