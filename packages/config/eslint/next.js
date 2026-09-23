import base from './base.js';

/** Next.js app rules. */
export default [
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Tokens, never literal colours (docs/03 section 4).
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]',
          message:
            'Use a design token (text-ink, bg-surface, ...) rather than a hex literal. See docs/03 section 4.',
        },
      ],
    },
  },
  {
    // The token definitions themselves, and the ported brand SVGs, are allowed
    // to contain hex values.
    files: [
      'src/styles/**',
      'src/components/brand/**',
      'src/lib/brand.ts',
      'src/app/**/opengraph-image.tsx',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // The design-system reference is a flat catalog of every primitive.
    // Splitting it into a dozen wrappers would make it harder to scan, which
    // is the one thing that page exists to be.
    files: ['src/app/(dev)/**'],
    rules: { 'max-lines-per-function': 'off', 'max-lines': 'off' },
  },
  {
    // Playwright specs: long describe blocks are how a suite is organised,
    // and the test runner owns the promise lifecycle.
    files: ['e2e/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
