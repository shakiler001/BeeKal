'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import {
  MIN_ANSWERS,
  SCORE_DIMENSIONS,
  SCORE_LEVELS,
  calculateLevel,
  type ScoreDimension,
} from '@/content/score';
import { cn } from '@/lib/cn';
import { ScoreRadar } from './score-radar';
import { ScoreReportOptIn } from './score-report-optin';

/**
 * The Business System Maturity Score, ported from the demo.
 *
 * Deliberate product decisions carried over (docs/00 section 6):
 *  - The result is free and requires no email. The demo promises exactly that
 *    on the page, and gating it now would break a stated promise.
 *  - At least six of nine must be answered, so a level is never drawn from two
 *    sliders.
 *  - Sliders start unanswered rather than at 3. A pre-filled midpoint silently
 *    answers for the visitor and makes every result drift toward the middle.
 *
 * Accessibility, all from the demo:
 *  - aria-valuetext says what the number means, not just the number
 *  - a live region announces the level as it resolves
 *  - the whole thing degrades to a plain notice without JavaScript
 */
export function ScoreTool() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [shareCode, setShareCode] = useState<string | null>(null);
  const savedFor = useRef<string>('');

  const answeredCount = Object.keys(answers).length;
  const ready = answeredCount >= MIN_ANSWERS;

  const result = useMemo(() => (ready ? calculateLevel(answers) : null), [answers, ready]);
  const levelInfo = result ? SCORE_LEVELS.find((l) => l.level === result.level) : null;

  /**
   * Persist once the result is complete, so it becomes shareable.
   *
   * Scored in the browser first: the answer appears instantly and does not
   * depend on the network. Saving is a background nicety — if it fails, the
   * visitor still has their result and simply has no share link, so this never
   * surfaces an error.
   */
  useEffect(() => {
    if (!ready) return;
    const fingerprint = JSON.stringify(answers);
    if (savedFor.current === fingerprint) return;
    savedFor.current = fingerprint;

    const params = new URLSearchParams(window.location.search);
    void fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
        utmSource: params.get('utm_source') ?? undefined,
        utmMedium: params.get('utm_medium') ?? undefined,
        utmCampaign: params.get('utm_campaign') ?? undefined,
        referrer: document.referrer || undefined,
      }),
    })
      .then((res) => (res.ok ? (res.json() as Promise<{ shareCode: string }>) : null))
      .then((body) => {
        if (body) setShareCode(body.shareCode);
      })
      .catch(() => {
        // Deliberately silent. See above.
      });
  }, [answers, ready]);

  function set(key: string, value: number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      <div>
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <p className="tabular font-medium" aria-live="polite">
            {ready
              ? `${answeredCount} of ${SCORE_DIMENSIONS.length} answered`
              : `Answer at least ${MIN_ANSWERS} to see your level (${answeredCount} of ${SCORE_DIMENSIONS.length})`}
          </p>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="text-ink-2 hover:text-ink min-h-11 text-[0.9rem] underline underline-offset-4"
            >
              Clear answers
            </button>
          )}
        </div>

        <ul className="mt-6 grid gap-7">
          {SCORE_DIMENSIONS.map((d) => (
            <li key={d.key}>
              <Dimension dimension={d} value={answers[d.key]} onChange={(v) => set(d.key, v)} />
            </li>
          ))}
        </ul>
      </div>

      <Card padding="lg" className="lg:sticky lg:top-[calc(var(--head)+24px)]">
        <ScoreRadar answers={answers} />

        {!result || !levelInfo ? (
          <div className="mt-5">
            <p className="font-display font-bold">Your result appears here.</p>
            <p className="text-ink-2 mt-2 text-[0.95rem] leading-relaxed">
              Answer at least {MIN_ANSWERS} of the {SCORE_DIMENSIONS.length} to see your level, your
              weakest dimensions and where to look first.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <p className="flex items-baseline gap-3">
              <b className="text-brand font-display tabular text-[2rem] leading-none font-extrabold tracking-[-0.04em]">
                Level {levelInfo.level}
              </b>
              <span className="font-display text-lg font-semibold">{levelInfo.name}</span>
            </p>
            <p className="text-ink-2 mt-3 text-[0.95rem] leading-relaxed">
              {levelInfo.description}
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed">{levelInfo.guidance}</p>

            <div className="border-line-2 mt-5 border-t pt-4">
              <h3 className="text-ink-2 text-[0.78rem] font-bold tracking-[0.09em] uppercase">
                Look here first
              </h3>
              <ul className="mt-2 space-y-1">
                {result.weakest.map((d) => (
                  <li key={d.key} className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{d.label}</span>
                    <span className="text-ink-2 tabular text-[0.9rem]">{answers[d.key]} / 5</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Button asChild={ready} full className="mt-6" disabled={!ready}>
          {ready ? (
            <Link href="/contact?intent=assessment">Talk about fixing this</Link>
          ) : (
            <span>Answer {MIN_ANSWERS} to continue</span>
          )}
        </Button>

        <p className="sr" aria-live="polite">
          {levelInfo ? `Level ${levelInfo.level}, ${levelInfo.name}. ${levelInfo.description}` : ''}
        </p>

        {shareCode && (
          <p className="border-line text-ink-2 mt-5 border-t pt-4 text-[0.85rem]">
            Send this result to a colleague:{' '}
            <a
              href={`/score/r/${shareCode}`}
              className="text-ink break-all underline underline-offset-4"
            >
              /score/r/{shareCode}
            </a>
          </p>
        )}
      </Card>

      {shareCode && (
        <div className="lg:col-span-2">
          <ScoreReportOptIn shareCode={shareCode} />
        </div>
      )}
    </div>
  );
}

function Dimension({
  dimension: d,
  value,
  onChange,
}: {
  dimension: ScoreDimension;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const answered = value !== undefined;
  const anchor = answered ? d.anchors[value - 1] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={`score-${d.key}`} className="font-display font-semibold">
          {d.label}
        </label>
        <output
          htmlFor={`score-${d.key}`}
          className={cn(
            'tabular text-[0.9rem] font-medium',
            answered ? 'text-brand' : 'text-ink-2',
          )}
        >
          {answered ? `${value} / 5` : 'Not answered'}
        </output>
      </div>

      <p className="text-ink-2 mt-0.5 text-[0.92rem]">{d.question}</p>

      <input
        id={`score-${d.key}`}
        type="range"
        min={1}
        max={5}
        step={1}
        value={value ?? 3}
        // aria-valuetext says what the number MEANS. "3" alone tells a screen
        // reader user nothing about their business.
        aria-valuetext={answered ? `${value} of 5: ${anchor}` : 'Not answered'}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('accent-brand mt-3 h-11 w-full cursor-pointer', !answered && 'opacity-50')}
      />

      <p className="text-ink-2 mt-1 text-[0.88rem] italic">
        {anchor ?? 'Move the slider to answer.'}
      </p>
    </div>
  );
}
