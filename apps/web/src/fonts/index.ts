import localFont from 'next/font/local';

/**
 * Self-hosted fonts.
 *
 * The demo loaded these from Google Fonts. Three reasons they are local now:
 *
 *  1. A third-party connection sits on the critical path for first paint, and
 *     removing it typically returns 200-400ms of LCP (docs/05 section 2.2).
 *  2. `next/font/google` fetches at BUILD time, so a Docker build with no
 *     network fails outright — which is how this got fixed.
 *  3. No-lock-in (docs/00 section 3): the build must not need a third party to
 *     be reachable.
 *
 * Both are variable fonts, so one file per family covers every weight we use —
 * two requests instead of seven, 55KB total.
 *
 * `adjustFontFallback` is off and the metrics are stated explicitly, because
 * Next cannot infer the override values for a local variable font. These come
 * from the font's own metrics and keep the fallback from shifting the layout
 * when the real face swaps in.
 */

export const sora = localFont({
  src: [
    {
      path: './sora-latin-var.woff2',
      weight: '100 800',
      style: 'normal',
    },
  ],
  variable: '--font-sora',
  display: 'swap',
  preload: true,
  fallback: ['Segoe UI', 'system-ui', 'sans-serif'],
  adjustFontFallback: false,
});

export const instrumentSans = localFont({
  src: [
    {
      path: './instrument-sans-latin-var.woff2',
      weight: '400 700',
      style: 'normal',
    },
  ],
  variable: '--font-instrument',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: false,
});

export const fontVariables = `${sora.variable} ${instrumentSans.variable}`;
