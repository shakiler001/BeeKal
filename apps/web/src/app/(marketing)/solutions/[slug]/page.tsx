import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Bridge } from '@/components/patterns';
import { Button, Card, Section, SectionHeader, Wrap } from '@/components/ui';
import { CheckIcon } from '@/components/brand';
import { SOLUTIONS } from '@/content/solutions';
import { caseStudiesFor } from '@/content/case-studies';
import { PROBLEMS } from '@/content/problems';
import { CaseCard } from '@/features/case-studies/case-card';
import { serviceSchema } from '@/lib/schema';

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = SOLUTIONS.find((s) => s.slug === slug);
  if (!solution) return {};
  return {
    title: solution.seoTitle,
    description: solution.seoDescription,
    alternates: { canonical: `/solutions/${solution.slug}` },
  };
}

/**
 * The page the founder pastes into a reply when someone asks "do you do X?".
 * Budget ~700 words, identical structure across all five (docs/02 section 3.3).
 */
export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = SOLUTIONS.find((s) => s.slug === slug);
  if (!solution) notFound();

  const cases = caseStudiesFor(solution.key);
  const relatedProblems = PROBLEMS.filter((p) => p.solutionKey === solution.key);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema(solution)) }}
      />

      <Section>
        <Wrap>
          <SectionHeader
            eyebrow={solution.name}
            title={solution.pageHeadline}
            lede={solution.pageIntro}
            headingLevel="h1"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact?intent=assessment">Request an assessment</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/contact?intent=talk">Describe your problem</Link>
            </Button>
          </div>
        </Wrap>
      </Section>

      <Section tone="alt">
        <Wrap>
          <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
            Three signs you need this
          </h2>
          <ul className="mt-8 grid gap-4 lg:grid-cols-3">
            {solution.signs.map((sign, i) => (
              <li key={sign}>
                <Card className="h-full">
                  <span className="text-brand tabular font-display text-[1.6rem] font-bold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-2 leading-snug">{sign}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
                What we actually do
              </h2>
              <ul className="mt-6 space-y-3">
                {solution.whatWeDo.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="text-brand mt-1 size-5 flex-none" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card padding="lg" tone="alt" elevation="none">
              <h2 className="font-display text-lg font-bold tracking-tight">What changes</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                    Before
                  </h3>
                  <ul className="mt-3 space-y-2 text-[0.95rem]">
                    {solution.before.map((b) => (
                      <li key={b} className="text-ink-2">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-brand text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                    After
                  </h3>
                  <ul className="mt-3 space-y-2 text-[0.95rem]">
                    {solution.after.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </Wrap>
      </Section>

      {cases.length > 0 && (
        <Section tone="alt">
          <Wrap>
            <h2 className="text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
              {cases.length === 1 ? 'A worked example' : 'Worked examples'}
            </h2>
            <ul className="mt-8 grid gap-5 lg:grid-cols-2">
              {cases.map((c) => (
                <li key={c.slug}>
                  <CaseCard caseStudy={c} />
                </li>
              ))}
            </ul>
          </Wrap>
        </Section>
      )}

      <Section>
        <Wrap>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="max-w-[24ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
                Most of these start with an assessment.
              </h2>
              <p className="text-ink-2 mt-4 max-w-[52ch]">
                Not because we insist on it, but because the wrong build is more expensive than the
                diagnosis that prevents it. If you already know exactly what you need, say so and we
                will go straight to a proposal.
              </p>
              {relatedProblems.length > 0 && (
                <p className="text-ink-2 mt-5 text-[0.95rem]">
                  Related:{' '}
                  {relatedProblems.map((p, i) => (
                    <span key={p.key}>
                      {i > 0 && ', '}
                      <Link
                        href={`/problems/${p.slug}`}
                        className="text-ink underline underline-offset-4"
                      >
                        {p.cardHeadline.replace(/\?$/, '')}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild>
                <Link href="/assessment">How the assessment works</Link>
              </Button>
            </div>
          </div>

          <Bridge href="/method">See how the work actually runs, week by week.</Bridge>
        </Wrap>
      </Section>
    </>
  );
}
