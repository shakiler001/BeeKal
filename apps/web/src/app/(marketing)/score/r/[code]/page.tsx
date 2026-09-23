import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ScoreResult } from '@beekal/contracts';
import { Button, Card, Section, SectionHeader, Wrap } from '@/components/ui';
import { SCORE_DIMENSIONS, SCORE_LEVELS } from '@/content/score';
import { ScoreRadar } from '@/features/score/score-radar';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

export const metadata: Metadata = {
  title: 'Maturity score result',
  // A shared result is personal. It should be openable by anyone holding the
  // link and findable by nobody.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function getResult(code: string): Promise<ScoreResult | null> {
  try {
    const res = await fetch(`${API_URL}/api/score/r/${encodeURIComponent(code)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as ScoreResult;
  } catch {
    return null;
  }
}

/**
 * A shared result.
 *
 * This page is why the score persists at all: a COO can send their result to
 * the CEO, which is distribution the demo's version could not do.
 */
export default async function SharedScorePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await getResult(code);
  if (!result) notFound();

  const level = SCORE_LEVELS.find((l) => l.level === result.level);
  const weakest = result.weakest
    .map((key) => SCORE_DIMENSIONS.find((d) => d.key === key))
    .filter((d): d is (typeof SCORE_DIMENSIONS)[number] => d !== undefined);

  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Shared result"
          title={`Level ${result.level} — ${level?.name ?? ''}`}
          lede={level?.description}
          headingLevel="h1"
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Card padding="lg">
            <ScoreRadar answers={result.answers} />
          </Card>

          <div className="grid gap-6">
            <Card>
              <h2 className="font-display text-lg font-bold tracking-tight">What this means</h2>
              <p className="mt-3 leading-relaxed">{level?.guidance}</p>
            </Card>

            {weakest.length > 0 && (
              <Card>
                <h2 className="font-display text-lg font-bold tracking-tight">Look here first</h2>
                <ul className="mt-4 grid gap-4">
                  {weakest.map((d) => (
                    <li key={d.key}>
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{d.label}</span>
                        <span className="text-ink-2 tabular flex-none text-[0.9rem]">
                          {result.answers[d.key]} / 5
                        </span>
                      </p>
                      <p className="text-ink-2 mt-1 text-[0.92rem] italic">
                        {d.anchors[(result.answers[d.key] ?? 1) - 1]}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact?intent=assessment">Talk about fixing this</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/score">Score your own business</Link>
              </Button>
            </div>
          </div>
        </div>

        <p className="text-ink-2 mt-10 text-[0.88rem]">
          Completed{' '}
          {new Date(result.completedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          . This is a self-assessment, not an audit — the{' '}
          <Link href="/assessment" className="text-ink underline underline-offset-4">
            Business System Assessment
          </Link>{' '}
          is the one where we check rather than ask.
        </p>
      </Wrap>
    </Section>
  );
}
