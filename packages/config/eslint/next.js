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
    files: ['src/styles/**', 'src/components/brand/**', 'src/lib/brand.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
