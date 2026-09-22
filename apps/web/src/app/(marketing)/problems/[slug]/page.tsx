import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Button, Card, Section, SectionHeader, Wrap } from '@/components/ui';
import { CheckIcon } from '@/components/brand';
import { PROBLEMS } from '@/content/problems';
import { SOLUTION_BY_KEY } from '@/content/solutions';
import { breadcrumbSchema } from '@/lib/schema';

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) return {};
  return {
    title: problem.seoTitle,
    description: problem.seoDescription,
    alternates: { canonical: `/problems/${problem.slug}` },
  };
}

/**
 * Cold-traffic and ad destination. Deliberately narrower than a solution page:
 * ~450 words, single intent, single ask (docs/02 section 3.4).
 *
 * These exist so a paid click about manual work lands on manual work rather
 * than a general homepage.
 */
export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = PROBLEMS.find((p) => p.slug === slug);
  if (!problem) notFound();

  const solution = SOLUTION_BY_KEY[problem.solutionKey];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: problem.cardHeadline, path: `/problems/${problem.slug}` },
            ]),
          ),
        }}
      />

      <Section>
        <Wrap>
          <SectionHeader
            eyebrow={problem.cardAnswer}
            title={problem.pageHeadline}
            lede={problem.pageIntro}
            headingLevel="h1"
          />
        </Wrap>
      </Section>

      <Section tone="alt">
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-[clamp(1.4rem,1.15rem+1.2vw,1.9rem)] leading-tight font-bold tracking-[-0.03em]">
                If three of these five are true, this is you
              </h2>
              <ul className="mt-6 space-y-3">
                {problem.diagnostic.map((d) => (
                  <li key={d} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="border-field mt-0.5 size-5 flex-none rounded border-[1.5px]"
                    />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card padding="lg">
              <h2 className="font-display text-lg font-bold tracking-tight">
                What usually causes it
              </h2>
              <p className="text-ink-2 mt-4 leading-relaxed">{problem.causes}</p>

              <h3 className="font-display mt-8 text-lg font-bold tracking-tight">
                What fixing it looks like
              </h3>
              <ul className="mt-4 space-y-2.5">
                {problem.fixLooksLike.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[0.98rem]">
                    <CheckIcon className="text-brand mt-0.5 size-5 flex-none" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Wrap>
      </Section>

      <Section>
        <Wrap>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="max-w-[26ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.1rem)] leading-tight font-bold tracking-[-0.03em]">
                The first step is finding out how much it is costing you.
              </h2>
              <p className="text-ink-2 mt-4 max-w-[52ch]">
                Tell us what your week looks like. We will say whether an assessment is the right
                next step — or whether something smaller would fix it.
              </p>
              <p className="text-ink-2 mt-5 text-[0.95rem]">
                This is usually{' '}
                <Link
                  href={`/solutions/${solution.slug}`}
                  className="text-ink underline underline-offset-4"
                >
                  {solution.name}
                </Link>{' '}
                work.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild>
                <Link href="/contact?intent=talk">Describe your problem</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/score">Score your business</Link>
              </Button>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
