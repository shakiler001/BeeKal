import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const base = {
  APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://beekal:pw@localhost:5432/beekal',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: 'a'.repeat(32),
};

describe('loadEnv', () => {
  it('accepts a minimal valid configuration', () => {
    const env = loadEnv({ ...base, STORAGE_DRIVER: 'local' });
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
  });

  it('rejects a short session secret', () => {
    expect(() =>
      loadEnv({ ...base, SESSION_SECRET: 'too-short', STORAGE_DRIVER: 'local' }),
    ).toThrow(/SESSION_SECRET/);
  });

  it('rejects a missing database url', () => {
    const { DATABASE_URL: _omitted, ...withoutDb } = base;
    expect(() => loadEnv({ ...withoutDb, STORAGE_DRIVER: 'local' })).toThrow(/DATABASE_URL/);
  });

  it('splits CORS_ORIGINS into a trimmed list', () => {
    const env = loadEnv({
      ...base,
      STORAGE_DRIVER: 'local',
      CORS_ORIGINS: 'http://a.test, http://b.test ,',
    });
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('requires a bucket when the storage driver is s3', () => {
    // The shape alone cannot express this, so it is a cross-field rule.
    expect(() => loadEnv({ ...base, STORAGE_DRIVER: 's3' })).toThrow(/S3_BUCKET/);
  });

  it('requires an smtp host when the mail driver is smtp', () => {
    expect(() => loadEnv({ ...base, STORAGE_DRIVER: 'local', MAIL_DRIVER: 'smtp' })).toThrow(
      /SMTP_HOST/,
    );
  });

  it('requires an api key when an AI driver is selected', () => {
    expect(() => loadEnv({ ...base, STORAGE_DRIVER: 'local', AI_DRIVER: 'anthropic' })).toThrow(
      /AI_API_KEY/,
    );
  });

  it('defaults the AI driver to none, so nothing calls a model by accident', () => {
    const env = loadEnv({ ...base, STORAGE_DRIVER: 'local' });
    expect(env.AI_DRIVER).toBe('none');
  });
});
