import boundaries from 'eslint-plugin-boundaries';
import base from './base.js';

/**
 * API rules, including the hexagonal boundary enforcement from
 * docs/03-system-architecture.md section 1.
 *
 * These are the rules that get broken under deadline pressure, and they are the
 * ones that make later extraction possible. So CI enforces them rather than a
 * code reviewer remembering.
 */
export default [
  ...base,
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/modules/*/domain/**' },
        { type: 'application', pattern: 'src/modules/*/application/**' },
        { type: 'ports', pattern: 'src/modules/*/ports/**' },
        { type: 'infrastructure', pattern: 'src/modules/*/infrastructure/**' },
        { type: 'http', pattern: 'src/modules/*/http/**' },
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'config', pattern: 'src/config/**' },
      ],
      'boundaries/include': ['src/**/*.ts'],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // The domain core imports nothing outside itself. No NestJS, no
            // Prisma, no framework of any kind.
            { from: 'domain', allow: ['domain'] },

            // Application depends on domain and on ports — never on a concrete
            // adapter.
            { from: 'application', allow: ['domain', 'ports', 'shared'] },

            // Ports describe what a module needs, in domain terms.
            { from: 'ports', allow: ['domain', 'shared'] },

            // Infrastructure implements ports. It may see the domain to map to
            // and from it.
            { from: 'infrastructure', allow: ['domain', 'ports', 'shared', 'config'] },

            // HTTP is a delivery mechanism. It calls use cases and never
            // reaches into the domain directly.
            { from: 'http', allow: ['application', 'shared', 'config'] },

            { from: 'shared', allow: ['shared'] },
            { from: 'config', allow: ['config', 'shared'] },
          ],
        },
      ],

      // No cross-module database access. A module reaches another module only
      // through its published application service or a domain event — never
      // through its Prisma models. This is rule 5 in docs/03 section 1.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/modules/*/infrastructure/**'],
              message:
                "Cross-module infrastructure import. Go through the module's application service or a domain event instead (docs/03 section 1, rule 5).",
            },
            {
              group: ['**/modules/*/domain/**'],
              message:
                'Cross-module domain import. Compose in the application layer instead (docs/03 section 1, rule 4).',
            },
          ],
        },
      ],
    },
  },
  {
    // Module wiring files bind ports to adapters, so they must see both.
    files: ['src/modules/*/*.module.ts', 'src/main.ts', 'src/app.module.ts'],
    rules: {
      'boundaries/element-types': 'off',
      'no-restricted-imports': 'off',
    },
  },
];
