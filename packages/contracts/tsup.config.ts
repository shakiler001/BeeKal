import { defineConfig } from 'tsup';

/**
 * Dual build: the API is CommonJS (NestJS decorators need it), the web app is
 * ESM. A shared package consumed by both has to ship both, or one of them gets
 * a runtime require/import mismatch the moment a Zod schema is used as a value
 * rather than a type.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/shared/index.ts',
    'src/health/index.ts',
    'src/leads/index.ts',
    'src/auth/index.ts',
    'src/admin/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  outDir: 'dist',
});
