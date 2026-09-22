'use client';

import { SCORE_DIMENSIONS } from '@/content/score';

/**
 * Radar chart for the nine dimensions.
 *
 * Hand-drawn SVG rather than a charting library: this is nine points on a fixed
 * polar grid, and pulling in a chart package for it would cost more kilobytes
 * than the whole score feature.
 *
 * The chart is decorative — every value it shows is also stated in text beside
 * it — so it carries a summary label and its internals are hidden from
 * assistive technology. Colour is never the only carrier of meaning
 * (docs/05 section 3).
 */

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 110;
const MAX = 5;

function point(index: number, value: number): [number, number] {
  const count = SCORE_DIMENSIONS.length;
  // Start at 12 o'clock and go clockwise.
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const r = (value / MAX) * RADIUS;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

export function ScoreRadar({ answers }: { answers: Record<string, number> }) {
  const answeredCount = Object.keys(answers).length;

  const polygon = SCORE_DIMENSIONS.map((d, i) => point(i, answers[d.key] ?? 0).join(',')).join(' ');

  const label =
    answeredCount === 0
      ? 'Radar chart of the nine dimensions. No answers yet.'
      : `Radar chart of the nine dimensions. ${answeredCount} answered. ${SCORE_DIMENSIONS.filter(
          (d) => answers[d.key] !== undefined,
        )
          .map((d) => `${d.label} ${answers[d.key]} of 5`)
          .join(', ')}.`;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-[320px]"
      role="img"
      aria-label={label}
    >
      {/* Grid rings */}
      {[1, 2, 3, 4, 5].map((ring) => (
        <polygon
          key={ring}
          points={SCORE_DIMENSIONS.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}

      {/* Spokes */}
      {SCORE_DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, MAX);
        return (
          <line
            key={d.key}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth="1"
          />
        );
      })}

      {/* The shape */}
      {answeredCount > 0 && (
        <polygon
          points={polygon}
          fill="var(--brand)"
          fillOpacity="0.18"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {/* Answered points */}
      {SCORE_DIMENSIONS.map((d, i) => {
        const value = answers[d.key];
        if (value === undefined) return null;
        const [x, y] = point(i, value);
        return <circle key={d.key} cx={x} cy={y} r="3.5" fill="var(--brand)" />;
      })}

      {/* Dimension labels */}
      {SCORE_DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, MAX + 1.15);
        const anchor = x < CENTER - 6 ? 'end' : x > CENTER + 6 ? 'start' : 'middle';
        return (
          <text
            key={d.key}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10.5"
            fontWeight="600"
            fill="var(--ink-2)"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
