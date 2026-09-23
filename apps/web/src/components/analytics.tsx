import Script from 'next/script';

/**
 * Self-hosted, cookie-free analytics.
 *
 * Renders nothing until both env vars are set, so a fresh clone and a local
 * dev server send no traffic anywhere. No cookies, no cross-site identifiers,
 * no data leaving our own server — which is also why this site needs no cookie
 * banner (docs/05 section 4.2).
 */
export function Analytics() {
  const url = process.env['NEXT_PUBLIC_UMAMI_URL'];
  const websiteId = process.env['NEXT_PUBLIC_UMAMI_WEBSITE_ID'];

  if (!url || !websiteId) return null;

  return (
    <Script
      src={`${url}/script.js`}
      data-website-id={websiteId}
      // Never on the critical path. The measurement is worth nothing if it
      // costs the LCP it is measuring.
      strategy="afterInteractive"
      defer
    />
  );
}
