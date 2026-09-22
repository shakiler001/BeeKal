import type { Metadata, Viewport } from 'next';
import { Sora, Instrument_Sans } from 'next/font/google';
import { THEME_COLOR } from '@/lib/brand';
import '@/styles/globals.css';

/**
 * Fonts are self-hosted by next/font at build time — no runtime connection to
 * a third party on the critical path. `display: swap` plus the metric-matched
 * fallback keeps the swap from moving the layout (docs/05 section 2.2).
 */
const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Beekal — Software, Automation & AI Systems for Growing Businesses',
    template: '%s | Beekal',
  },
  description:
    'Beekal designs and builds the software, automation and AI systems that remove manual work from growing businesses. Start with a Business System Assessment — Dhaka, Bangladesh.',
  robots: { index: true, follow: true },
  // TODO: confirm the live domain (www vs apex) before launch — docs/00 section 7.
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://beekal.com'),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Applies the saved theme before first paint so there is no flash. Ported from
 * the demo, which got this right.
 */
const noFlashTheme = `
try {
  var t = localStorage.getItem('bk-theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
document.documentElement.classList.add('has-js');
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr focus:bg-brand focus:text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
