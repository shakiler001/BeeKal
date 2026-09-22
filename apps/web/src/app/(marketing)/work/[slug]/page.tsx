import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Button, Card, Metric, Section, Wrap } from '@/components/ui';
import { CASE_STUDIES } from '@/content/case-studies';
import { SOLUTION_BY_KEY } from '@/content/solutions';
import { IllustrativeBadge } from '@/features/case-studies/illustrative-badge';
import { breadcrumbSchema, caseStudySchema } from '@/lib/schema';

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = CASE_STUDIES.find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.problem,
    alternates: { canonical: `/work/${c.slug}` },
    // An example scenario must never be indexed as a client result.
    robots: c.isIllustrative ? { index: false, follow: true } : undefined,
  };
}

/**
 * The eight-part format, kept from the demo.
 *
 * The Lesson section — what we would do differently — is mandatory and is the
 * most credible element on the site, precisely because nobody fakes one.
 */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CASE_STUDIES.find((x) => x.slug === slug);
  if (!c) notFound();

  const solution = SOLUTION_BY_KEY[c.solutionKey];
  const schema = caseStudySchema(c);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Case studies', path: '/work' },
              { name: c.title, path: `/work/${c.slug}` },
            ]),
          ),
        }}
      />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}

      <Section>
        <Wrap>
          <p className="text-ink-2 text-[0.9rem]">
            <Link href="/work" className="hover:text-ink underline underline-offset-4">
              Case studies
            </Link>
            <span aria-hidden> · </span>
            <Link
              href={`/solutions/${solution.slug}`}
              className="hover:text-ink underline underline-offset-4"
            >
              {solution.name}
            </Link>
          </p>

          {c.isIllustrative && (
            <div className="mt-5">
              <IllustrativeBadge />
            </div>
          )}

          <h1 className="text-heading mt-4 max-w-[22ch] text-[clamp(2rem,1.5rem+2.4vw,3.2rem)] leading-[1.08] font-extrabold tracking-[-0.04em]">
            {c.title}
          </h1>
          <p className="text-ink-2 mt-4">
            {c.clientName ? `${c.clientName} · ` : ''}
            {c.context}
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <div className="space-y-8">
              <Part title="The problem">{c.problem}</Part>
              <Part title="What was happening before">
                <strong className="text-ink block">{c.beforeLead}</strong>
                <span className="mt-1 block">{c.before}</span>
              </Part>
              <Part title="Diagnosis">{c.diagnosis}</Part>
              <Part title="What Beekal changed">{c.whatChanged}</Part>
              <Part title="How it was built">{c.howBuilt}</Part>
            </div>

            <Card padding="lg" className="lg:sticky lg:top-[calc(var(--head)+24px)]">
              <h2 className="font-display text-lg font-bold tracking-tight">Result</h2>
              <div className="mt-4">
                {c.results.map((r) => (
                  <Metric key={r.label} value={r.value} label={r.label} />
                ))}
              </div>
              <p className="border-line-2 mt-6 border-t pt-5 text-[0.95rem] leading-relaxed">
                <strong className="font-display mb-1 block">Lesson</strong>
                <span className="text-ink-2">{c.lesson}</span>
              </p>
            </Card>
          </div>

          <div className="border-line mt-14 border-t pt-10">
            <h2 className="max-w-[26ch] text-[clamp(1.4rem,1.15rem+1.2vw,1.9rem)] leading-tight font-bold tracking-[-0.03em]">
              Recognise any of this in your own operation?
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact?intent=assessment">Request an assessment</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/solutions/${solution.slug}`}>More on {solution.name}</Link>
              </Button>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-brand text-[0.8rem] font-bold tracking-[0.09em] uppercase">{title}</h2>
      <div className="mt-2.5 text-[1.05rem] leading-relaxed">{children}</div>
    </section>
  );
}
