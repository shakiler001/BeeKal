'use client';

import { useEffect, useRef, useState } from 'react';
import { Bee } from '@/components/brand';
import { cn } from '@/lib/cn';

/**
 * The before/after hero animation, ported from the demo.
 *
 * Six scattered tools converge into one connected system. It is the highest-
 * value interaction on the site — it states the whole proposition without a
 * sentence — so the port preserves every detail of how it behaves:
 *
 *  - plays once, on entering the viewport, never on a loop
 *  - has a timeout fallback, so it still plays if IntersectionObserver never
 *    fires (which happens when the hero is already fully visible on load in
 *    some browsers)
 *  - honours prefers-reduced-motion by starting in the finished state
 *  - animates transform and opacity only, so it runs on the compositor
 *  - the whole figure carries one descriptive label; the moving parts are
 *    hidden from assistive technology
 *  - a live region announces the state when the visitor toggles it manually
 */

interface Chip {
  label: string;
  /** Final position, as a percentage of the stage. */
  ax: number;
  ay: number;
  /** Scattered position. */
  bx: number;
  by: number;
  /** Scattered rotation, in degrees. */
  br: number;
}

const CHIPS: Chip[] = [
  { label: 'Excel sheets', ax: 50, ay: 12, bx: 24, by: 20, br: -8 },
  { label: 'Email threads', ax: 82.9, ay: 31, bx: 73, by: 15, br: 6 },
  { label: 'Legacy app', ax: 82.9, ay: 69, bx: 79, by: 47, br: -5 },
  { label: 'Manual reports', ax: 50, ay: 88, bx: 58, by: 67, br: 7 },
  { label: 'Paper forms', ax: 17.1, ay: 69, bx: 22, by: 76, br: -6 },
  { label: 'WhatsApp groups', ax: 17.1, ay: 31, bx: 37, by: 42, br: 9 },
];

const CAPTION = {
  before: 'Six systems. One business. Nothing agrees.',
  after: 'The same work, in one connected system.',
} as const;

type View = 'before' | 'after';

export function HeroStage() {
  const [view, setView] = useState<View>('before');
  const [announcement, setAnnouncement] = useState('');
  const figureRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Skip straight to the resolved state: the message matters, the motion
      // does not.
      playedRef.current = true;
      setView('after');
      return;
    }

    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      window.setTimeout(() => setView('after'), 900);
    };

    const el = figureRef.current;
    let observer: IntersectionObserver | undefined;

    if (el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect();
            play();
          }
        },
        { threshold: 0.35 },
      );
      observer.observe(el);
    }

    // Fallback: if the observer never fires, play anyway rather than leaving
    // the hero stuck in the "before" state forever.
    const fallback = window.setTimeout(play, 6000);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  function choose(next: View) {
    playedRef.current = true;
    setView(next);
    setAnnouncement(CAPTION[next]);
  }

  const after = view === 'after';

  return (
    <figure className="m-0">
      <div
        ref={figureRef}
        role="img"
        aria-label="Six scattered tools — spreadsheets, chats, email, old software and paper — brought together into one connected system."
        className="relative mx-auto aspect-square w-full max-w-[520px]"
      >
        {/* The ring: the brand's arc, drawn behind everything. */}
        <svg
          viewBox="0 0 100 100"
          aria-hidden
          className={cn(
            'absolute inset-0 size-full transition-opacity duration-700',
            after ? 'opacity-100' : 'opacity-0',
          )}
          fill="none"
        >
          <path
            d="M87.42 56.6A38 38 0 1 1 74.42 20.89"
            stroke="var(--accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        {/* Connection lines, drawn only once the system is one thing. */}
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full" fill="none">
          {CHIPS.map((c) => (
            <line
              key={c.label}
              x1="50"
              y1="50"
              x2={c.ax}
              y2={c.ay}
              stroke="var(--net)"
              strokeWidth="0.4"
              className={cn('transition-opacity duration-700', after ? 'opacity-40' : 'opacity-0')}
            />
          ))}
        </svg>

        {/* The hub. */}
        <div
          aria-hidden
          className={cn(
            'absolute top-1/2 left-1/2 w-[26%] -translate-x-1/2 -translate-y-1/2',
            'transition-all duration-700',
            after ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
          )}
        >
          <Bee className="h-auto w-full" />
        </div>

        {CHIPS.map((c) => (
          <span
            key={c.label}
            aria-hidden
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2',
              'bg-surface border-line-2 rounded-full border',
              'px-3 py-1.5 text-[clamp(0.68rem,0.5rem+0.6vw,0.85rem)] font-medium whitespace-nowrap',
              'shadow-card-sm',
              'transition-all duration-700 ease-out',
            )}
            style={{
              left: `${after ? c.ax : c.bx}%`,
              top: `${after ? c.ay : c.by}%`,
              transform: `translate(-50%,-50%) rotate(${after ? 0 : c.br}deg)`,
            }}
          >
            {c.label}
          </span>
        ))}
      </div>

      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-2 text-[0.95rem]">{CAPTION[view]}</p>

        <div
          className="border-field bg-surface inline-grid grid-flow-col gap-0.5 rounded-full border-[1.5px] p-1"
          role="group"
          aria-label="See the business before or after Beekal"
        >
          {(['before', 'after'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => choose(v)}
              aria-pressed={view === v}
              className={cn(
                'min-h-11 rounded-full px-4 text-[0.9rem] font-semibold capitalize transition-colors',
                view === v ? 'bg-brand text-on-brand' : 'text-ink-2 hover:text-ink',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </figcaption>

      <p className="sr" aria-live="polite">
        {announcement}
      </p>
    </figure>
  );
}
