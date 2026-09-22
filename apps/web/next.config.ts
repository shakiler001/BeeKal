import type { NextConfig } from 'next';

const config: NextConfig = {
  // Standalone output: the container runs on any Node host. No platform-only
  // build target (docs/00 section 3).
  //
  // Only enabled for the Docker build. Standalone traces dependencies by
  // symlink, which Windows refuses without Developer Mode — and a local build
  // does not need it. The Dockerfile sets BUILD_STANDALONE=1.
  ...(process.env['BUILD_STANDALONE'] === '1' ? { output: 'standalone' as const } : {}),
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // AVIF first, WebP fallback. Served through sharp, not a platform service.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'media.beekal.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'minio' },
    ],
  },

  // typedRoutes is off deliberately. From Phase 3 the content — solutions,
  // problems, case studies, articles — lives in Postgres, so slugs are runtime
  // values that no compile-time check can validate. Keeping it would mean
  // casting every data-driven href, which removes the safety while adding
  // noise. Link integrity is covered by the E2E crawl instead.
  typedRoutes: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        // The admin is never cached and never indexed (docs/03 section 4).
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default config;
