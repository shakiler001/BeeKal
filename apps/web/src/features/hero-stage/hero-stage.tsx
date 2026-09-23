'use client';

import { useEffect, useRef, useState } from 'react';
import { Bee } from '@/components/brand';
import { cn } from '@/lib/cn';
import styles from './hero-stage.module.css';

/**
 * The today/tomorrow hero animation, ported from the demo.
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
 *
 * The frame loop is imperative and writes to the DOM directly, exactly as the
 * demo does. Driving six chips, six connector paths, a hub and a pulse train
 * through React state would re-render the tree sixty times a second to move
 * things React is not otherwise responsible for. React owns the view state —
 * the caption, the pressed buttons, the live region — and nothing else.
 */

interface Chip {
  label: string;
  /** Scattered position, as a percentage of the stage. */
  bx: number;
  by: number;
  /** Scattered rotation, in degrees. */
  br: number;
}

/**
 * Order is load-bearing: the resting position of chip `i` is the point at
 * `-90 + i * 60` degrees, so this array reads clockwise from the top.
 */
const CHIPS: Chip[] = [
  { label: 'Excel sheets', bx: 24, by: 20, br: -8 },
  { label: 'Email threads', bx: 73, by: 15, br: 6 },
  { label: 'Legacy app', bx: 79, by: 47, br: -5 },
  { label: 'Manual reports', bx: 58, by: 67, br: 7 },
  { label: 'Paper forms', bx: 22, by: 76, br: -6 },
  { label: 'WhatsApp groups', bx: 37, by: 42, br: 9 },
];

/**
 * The caption carries the full phrase so the buttons can stay short enough to
 * tap. "Today" and "Tomorrow" also put the tagline - Beekal: Better Tomorrow -
 * on the page as a thing the visitor operates rather than a line they read.
 */
const CAPTION = {
  today: 'Your business today: six systems, and nothing agrees.',
  tomorrow: 'Your business tomorrow: the same work, in one connected system.',
} as const;

type View = 'today' | 'tomorrow';

const HUB = { x: 50, y: 50 };
const SVG_NS = 'http://www.w3.org/2000/svg';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * CSS-module class names, read once.
 *
 * `noUncheckedIndexedAccess` makes every lookup on the module's index
 * signature `string | undefined`, so they are resolved here rather than at
 * each of the dozen call sites.
 */
const css = {
  stage: styles['stage'] ?? '',
  ring: styles['ring'] ?? '',
  lines: styles['lines'] ?? '',
  pulse: styles['pulse'] ?? '',
  hub: styles['hub'] ?? '',
  chip: styles['chip'] ?? '',
  on: styles['on'] ?? '',
  off: styles['off'] ?? '',
};

/** Per-chip animation state. `s` runs 0 (scattered) to 1 (connected). */
interface Node {
  s: number;
  from: number;
  to: number;
  t0: number;
  /** Resting position, recomputed by layout() whenever the stage resizes. */
  ax: number;
  ay: number;
}

export function HeroStage() {
  const [view, setView] = useState<View>('today');
  const [announcement, setAnnouncement] = useState('');

  const stageRef = useRef<HTMLDivElement>(null);
  const ringPathRef = useRef<SVGPathElement>(null);
  const pulsesRef = useRef<SVGGElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  const nodesRef = useRef<Node[]>(
    CHIPS.map(() => ({ s: 0, from: 0, to: 0, t0: 0, ax: 50, ay: 50 })),
  );
  const playedRef = useRef(false);
  const viewRef = useRef<View>('today');

  /**
   * Exposes the imperative transition to the toggle buttons. The loop is set
   * up once on mount, so the handler reaches it through a ref rather than the
   * effect being rebuilt whenever the view changes.
   */
  const goRef = useRef<(target: 0 | 1, dur?: number, announce?: boolean) => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    const hub = hubRef.current;
    const ringPath = ringPathRef.current;
    const pulses = pulsesRef.current;
    if (!stage || !hub || !ringPath || !pulses) return;

    const nodes = nodesRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let pulseRaf = 0;

    /**
     * Resting geometry. The radius tightens below 470px so the chips, which
     * are laid out from their centres, do not hang off the edge of a narrow
     * stage. The ring arc is drawn to the same radius, so the two can never
     * disagree.
     */
    function layout(): void {
      const r = stage!.clientWidth < 470 ? 34.5 : 38;
      nodes.forEach((n, i) => {
        const angle = ((-90 + i * 60) * Math.PI) / 180;
        n.ax = 50 + r * Math.cos(angle);
        n.ay = 50 + r * Math.sin(angle);
      });
      const pt = (deg: number): [string, string] => {
        const rad = (deg * Math.PI) / 180;
        return [(50 + r * Math.cos(rad)).toFixed(2), (50 + r * Math.sin(rad)).toFixed(2)];
      };
      const [sx, sy] = pt(10);
      const [ex, ey] = pt(-50);
      ringPath!.setAttribute('d', `M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${ey}`);
    }

    const posOf = (n: Node, chip: Chip) => ({
      x: lerp(chip.bx, n.ax, n.s),
      y: lerp(chip.by, n.ay, n.s),
    });

    function render(): void {
      const current = nodes.map((n, i) => posOf(n, CHIPS[i]!));

      nodes.forEach((n, i) => {
        const e = ease(n.s);
        const here = current[i]!;
        const chipEl = chipRefs.current[i];
        const pathEl = pathRefs.current[i];
        const connected = n.s > 0.55;

        if (chipEl) {
          chipEl.style.left = `${here.x}%`;
          chipEl.style.top = `${here.y}%`;
          chipEl.style.transform = `translate(-50%,-50%) rotate(${CHIPS[i]!.br * (1 - e)}deg)`;
          chipEl.classList.toggle(css.on, connected);
        }

        if (pathEl) {
          // Each chip connects to the chip two places round, and that endpoint
          // slides into the hub as the system comes together. It is what makes
          // the six lines resolve into a star rather than a ring.
          const other = current[(i + 2) % current.length]!;
          const tx = lerp(other.x, HUB.x, e);
          const ty = lerp(other.y, HUB.y, e);
          const mx = (here.x + tx) / 2;
          const my = (here.y + ty) / 2;
          const dx = tx - here.x;
          const dy = ty - here.y;
          // Bow the curve while scattered, alternating sides, and straighten
          // it to nothing once connected.
          const k = (1 - e) * 0.32 * (i % 2 ? 1 : -1);
          pathEl.setAttribute(
            'd',
            `M${here.x} ${here.y}Q${mx - dy * k} ${my + dx * k} ${tx} ${ty}`,
          );
          pathEl.setAttribute('class', connected ? css.on : css.off);
        }
      });

      const mean = nodes.reduce((acc, n) => acc + n.s, 0) / nodes.length;
      hub!.style.opacity = String(Math.max(0, (mean - 0.35) / 0.65));
      hub!.style.transform = `translate(-50%,-50%) scale(${0.8 + 0.2 * mean})`;
    }

    function clearPulses(): void {
      cancelAnimationFrame(pulseRaf);
      pulses!.replaceChildren();
    }

    /** Amber dots running each chip's line into the hub, once, on arrival. */
    function pulse(): void {
      if (reduce) return;
      clearPulses();
      const t0 = performance.now();
      const dots = nodes.map(() => {
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('r', '1.15');
        c.setAttribute('class', css.pulse);
        c.setAttribute('opacity', '0');
        pulses!.appendChild(c);
        return c;
      });

      const tick = (t: number): void => {
        let live = false;
        dots.forEach((c, i) => {
          const k = (t - t0 - i * 110) / 850;
          if (k < 1) live = true;
          if (k <= 0 || k >= 1) {
            c.setAttribute('opacity', '0');
            return;
          }
          const q = posOf(nodes[i]!, CHIPS[i]!);
          const e = ease(k);
          c.setAttribute('cx', String(lerp(q.x, HUB.x, e)));
          c.setAttribute('cy', String(lerp(q.y, HUB.y, e)));
          c.setAttribute('opacity', '1');
        });
        if (live && viewRef.current === 'tomorrow') pulseRaf = requestAnimationFrame(tick);
        else clearPulses();
      };
      pulseRaf = requestAnimationFrame(tick);
    }

    function go(target: 0 | 1, dur = 1000, announce = false): void {
      cancelAnimationFrame(raf);
      clearPulses();

      const next: View = target ? 'tomorrow' : 'today';
      viewRef.current = next;
      setView(next);
      if (announce) setAnnouncement(CAPTION[next]);

      if (reduce) {
        nodes.forEach((n) => {
          n.s = target;
        });
        render();
        return;
      }

      const now = performance.now();
      nodes.forEach((n, i) => {
        n.from = n.s;
        n.to = target;
        // Stagger, so the six do not move as one block.
        n.t0 = now + i * 70;
      });

      const tick = (t: number): void => {
        let done = true;
        nodes.forEach((n) => {
          const k = Math.min(1, Math.max(0, (t - n.t0) / dur));
          n.s = n.from + (n.to - n.from) * ease(k);
          if (k < 1) done = false;
        });
        render();
        if (!done) raf = requestAnimationFrame(tick);
        else if (target) pulse();
      };
      raf = requestAnimationFrame(tick);
    }

    goRef.current = go;

    layout();

    const onResize = (): void => {
      layout();
      render();
    };
    window.addEventListener('resize', onResize);

    let observer: IntersectionObserver | undefined;
    let fallback = 0;
    let start = 0;

    if (reduce) {
      // Skip straight to the resolved state: the message matters, the motion
      // does not.
      playedRef.current = true;
      nodes.forEach((n) => {
        n.s = 1;
      });
      viewRef.current = 'tomorrow';
      setView('tomorrow');
      render();
    } else {
      nodes.forEach((n) => {
        n.s = 0;
      });
      render();

      const play = (): void => {
        if (playedRef.current) return;
        playedRef.current = true;
        observer?.disconnect();
        go(1, 1150);
      };

      if (typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((en) => en.isIntersecting) && !playedRef.current) {
              start = window.setTimeout(play, 260);
            }
          },
          { threshold: 0.6 },
        );
        observer.observe(stage);
      }

      // If the observer never fires, play anyway rather than leaving the hero
      // stuck in the "today" state forever.
      fallback = window.setTimeout(play, 6000);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pulseRaf);
      window.clearTimeout(fallback);
      window.clearTimeout(start);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, []);

  function choose(next: View): void {
    playedRef.current = true;
    goRef.current(next === 'tomorrow' ? 1 : 0, 1000, true);
  }

  return (
    <figure className="m-0 w-full max-w-[540px] justify-self-end max-lg:mx-auto">
      <div
        ref={stageRef}
        role="img"
        aria-label="Six scattered tools — spreadsheets, chats, email, old software and paper — brought together into one connected system."
        className={css.stage}
      >
        {/* The ring: the brand's arc, drawn behind everything. */}
        <svg viewBox="0 0 100 100" aria-hidden className={css.ring}>
          <path ref={ringPathRef} d="M87.42 56.6A38 38 0 1 1 74.42 20.89" />
        </svg>

        {/* Connectors, plus the group the pulse dots are appended into. */}
        <svg viewBox="0 0 100 100" aria-hidden className={css.lines}>
          {CHIPS.map((c, i) => (
            <path
              key={c.label}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              className={css.off}
            />
          ))}
          <g ref={pulsesRef} />
        </svg>

        <div ref={hubRef} aria-hidden className={css.hub}>
          <Bee />
        </div>

        {CHIPS.map((c, i) => (
          <span
            key={c.label}
            aria-hidden
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            className={css.chip}
            style={{
              left: `${c.bx}%`,
              top: `${c.by}%`,
              transform: `translate(-50%,-50%) rotate(${c.br}deg)`,
            }}
          >
            <i />
            {c.label}
          </span>
        ))}
      </div>

      <figcaption className="mt-[18px] flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <p className="font-display min-h-[2.7em] max-w-[19em] text-[1rem] leading-[1.35] font-semibold tracking-[-0.01em]">
          {CAPTION[view]}
        </p>

        <div
          className="border-field bg-surface inline-grid grid-flow-col gap-0.5 rounded-full border-[1.5px] p-1"
          role="group"
          aria-label="Your business today, or your business tomorrow with Beekal"
        >
          {(['today', 'tomorrow'] as const).map((v) => (
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
