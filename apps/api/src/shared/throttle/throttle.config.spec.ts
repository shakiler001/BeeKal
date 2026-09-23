import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../../config/env.js';
import {
  AUTH_THROTTLE,
  PUBLIC_READ_THROTTLE,
  PUBLIC_WRITE_THROTTLE,
  throttleConfig,
} from './throttle.config.js';

/** The minimum a validated config needs before `env()` will hand one over. */
const REQUIRED_ENV = {
  APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://beekal:pw@localhost:5432/beekal',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: 'a'.repeat(32),
  STORAGE_DRIVER: 'local',
} as const;

beforeAll(() => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) process.env[key] = value;
  resetEnvCache();
});

afterAll(() => {
  for (const key of Object.keys(REQUIRED_ENV)) delete process.env[key];
  resetEnvCache();
});

/**
 * These tests exist because of a bug that reached main and was invisible until
 * traffic arrived.
 *
 * Three named buckets were registered at the root — `default`, `auth` and
 * `public` — on the assumption that a route opted into one with
 * `@Throttle({ auth: ... })`. Every root throttler applies to every route, so
 * the tightest of the three became the ceiling for the whole API: five
 * requests a minute, on every endpoint, including the liveness probe that runs
 * six times a minute.
 *
 * Nothing caught it. Type checking cannot, because the shape was valid. The
 * accessibility and end-to-end suites cannot, because CI runs the web tests
 * with no API at all. The only thing that catches it is an assertion about how
 * many buckets are registered, which is the assertion nobody writes, because
 * you do not test for a limit you do not know exists.
 */
describe('throttleConfig', () => {
  it('registers exactly one root bucket', () => {
    const throttlers = throttleConfig().throttlers;

    // The load-bearing assertion. A second entry here silently applies its
    // limit to every route in the API, which is how a login limit became the
    // site limit. A route that needs to be stricter uses @Throttle with one of
    // the constants below; it does not get a bucket of its own here.
    expect(throttlers).toHaveLength(1);
    expect(throttlers[0]?.name).toBe('default');
  });

  it('takes the default limit from configuration, not a literal', () => {
    const bucket = throttleConfig().throttlers[0];

    // Deployments differ; the numbers belong in env, so a VPS behind a busy
    // NAT can be widened without a code change.
    expect(bucket?.ttl).toBe(60_000);
    expect(bucket?.limit).toBe(60);
  });

  it('states a message a person can act on', () => {
    expect(throttleConfig().errorMessage).toMatch(/wait a moment/i);
  });
});

describe('per-route overrides', () => {
  const OVERRIDES = {
    AUTH_THROTTLE,
    PUBLIC_WRITE_THROTTLE,
    PUBLIC_READ_THROTTLE,
  };

  for (const [name, override] of Object.entries(OVERRIDES)) {
    describe(name, () => {
      it('overrides the registered bucket rather than naming a new one', () => {
        // @Throttle keyed on a name that is not registered at the root does
        // nothing at all — the route silently keeps the default limit. Since
        // these are the endpoints that most need a limit, silence is the worst
        // possible failure.
        expect(Object.keys(override)).toEqual(['default']);
      });

      it('is stricter than the default, which is the only reason to exist', () => {
        const fallback = throttleConfig().throttlers[0];
        expect(override['default']?.limit).toBeLessThan(Number(fallback?.limit));
      });
    });
  }

  it('keeps login tight enough that online guessing is pointless', () => {
    expect(AUTH_THROTTLE['default']?.limit).toBe(5);
    expect(AUTH_THROTTLE['default']?.ttl).toBe(60_000);
  });
});
