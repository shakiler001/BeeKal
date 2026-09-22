import { z } from 'zod';

/**
 * Configuration comes from the environment and is validated at boot. An invalid
 * config fails the process immediately rather than at 3am on the first request
 * (docs/03 section 7).
 *
 * Note what is NOT here: business settings. The Assessment price, the contact
 * email and the reply-time promise live in the database so the founder can
 * change them without a deploy. A fact that needs a deploy to correct is a fact
 * that stays wrong.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  APP_URL: z.string().url(),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  REDIS_URL: z.string().url(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  SESSION_COOKIE_NAME: z.string().default('bk_session'),

  // Ports, each with a self-hosted default (docs/00 section 3).
  STORAGE_DRIVER: z.enum(['s3', 'local']).default('s3'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),

  MAIL_DRIVER: z.enum(['smtp', 'resend', 'ses', 'console']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Beekal <hello@beekal.com>'),
  MAIL_REPLY_TO: z.string().optional(),

  // Off until a feature justifies it. Master prompt section 17: do not add AI
  // because it is fashionable.
  AI_DRIVER: z.enum(['none', 'openai-compatible', 'anthropic', 'ollama']).default('none'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  // Cross-field rules the shape alone cannot express.
  const env = result.data;
  if (env.STORAGE_DRIVER === 's3' && !env.S3_BUCKET) {
    throw new Error(
      'Invalid environment configuration:\n  S3_BUCKET is required when STORAGE_DRIVER=s3',
    );
  }
  if (env.MAIL_DRIVER === 'smtp' && !env.SMTP_HOST) {
    throw new Error(
      'Invalid environment configuration:\n  SMTP_HOST is required when MAIL_DRIVER=smtp',
    );
  }
  if (env.AI_DRIVER !== 'none' && !env.AI_API_KEY) {
    throw new Error(
      'Invalid environment configuration:\n  AI_API_KEY is required when AI_DRIVER is not "none"',
    );
  }

  return env;
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

/** Test seam: lets a spec reset the memoised config. */
export function resetEnvCache(): void {
  cached = undefined;
}
