import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/brand';

/**
 * The social preview card, generated at build time.
 *
 * `next/og` renders this in the Node runtime with our own fonts, so nothing
 * calls out to a platform image service — a rendered PNG from a vendor URL
 * would be exactly the lock-in the plan rules out (docs/00 section 3).
 *
 * Deliberately typographic rather than a screenshot: a screenshot of a website
 * is unreadable at the size these actually appear in a feed.
 */
export const alt = 'Beekal — we build the business behind the business';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: BRAND.navy,
        padding: 72,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* The ring and a dot: the mark, reduced to what survives at this size. */}
        <svg width="64" height="64" viewBox="0 0 100 100">
          <path
            d="M87.42 56.6A38 38 0 1 1 74.42 20.89"
            fill="none"
            stroke={BRAND.amber}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="11" fill={BRAND.white} />
        </svg>
        <span style={{ color: BRAND.white, fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
          Beekal
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span
          style={{
            color: BRAND.white,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -3,
            maxWidth: 900,
          }}
        >
          Stop running six systems to run one business.
        </span>
        <span style={{ color: '#AEBAE6', fontSize: 30, lineHeight: 1.35, maxWidth: 820 }}>
          Software, automation and AI systems for growing businesses.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ width: 48, height: 5, background: BRAND.amber, borderRadius: 99 }} />
        <span style={{ color: BRAND.amber, fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>
          BETTER TOMORROW
        </span>
      </div>
    </div>,
    size,
  );
}
