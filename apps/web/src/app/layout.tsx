import type { Metadata, Viewport } from 'next';
import { BrandSprite } from '@/components/brand';
import { fontVariables } from '@/fonts';
import { THEME_COLOR } from '@/lib/brand';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import '@/styles/globals.css';

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
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        {/* Site-wide entity data, generated from the settings record. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr focus:bg-brand focus:text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <BrandSprite />
        {children}
      </body>
    </html>
  );
}
