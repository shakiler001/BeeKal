import { seconds, type ThrottlerOptions } from '@nestjs/throttler';
import { env } from '../../config/env.js';

/**
 * The object form of `ThrottlerModuleOptions`, stated explicitly.
 *
 * The library's own type is a union with a bare array, so callers - including
 * the test that guards the bucket count - cannot reach `throttlers` without
 * narrowing first. Naming the shape we actually return keeps that assertion
 * readable.
 */
interface ThrottleRootConfig {
  throttlers: ThrottlerOptions[];
  errorMessage: string;
}

/**
 * Rate limits.
 *
 * The root registration holds exactly one bucket, and this is the whole point.
 *
 * Every throttler registered at the root applies to every route. An earlier
 * version registered three named buckets here — `default`, `auth` and
 * `public` — intending them to be opt-in, selected per route by
 * `@Throttle({ auth: ... })`. They were not opt-in. The tightest of them, the
 * five-attempts-a-minute limit written to make password guessing pointless,
 * silently became the ceiling for the entire API.
 *
 * It was not a theoretical fault. The API's own liveness probe runs every ten
 * seconds — six requests a minute against a limit of five — and survived only
 * because Docker needs six consecutive failures and roughly one probe in six
 * was rejected. A second replica, an uptime monitor, or a load balancer
 * touching that route would have made the failures consecutive and put the
 * container into a restart loop.
 *
 * So: one bucket here, generous, and a route that needs to be stricter says so
 * itself with one of the constants below. A per-route `@Throttle` replaces the
 * default for that handler rather than adding to it.
 */
export function throttleConfig(): ThrottleRootConfig {
  const config = env();

  return {
    throttlers: [
      {
        name: 'default',
        ttl: config.RATE_LIMIT_WINDOW_MS,
        limit: config.RATE_LIMIT_MAX,
      },
    ],
    errorMessage: 'Too many requests. Wait a moment and try again.',
  };
}

/** The shape `@Throttle()` takes: an override of the named root bucket. */
type ThrottleOverride = Record<string, Pick<ThrottlerOptions, 'limit' | 'ttl'>>;

/**
 * Login and first password set.
 *
 * Deliberately tight. These are the endpoints where an attacker gets unlimited
 * free attempts at a secret, and five tries a minute makes online guessing
 * pointless without inconveniencing a person who mistyped.
 */
export const AUTH_THROTTLE: ThrottleOverride = {
  default: { limit: 5, ttl: seconds(60) },
};

/**
 * Unauthenticated writes — the lead form, the score submission.
 *
 * Generous enough that a real visitor never sees it, tight enough that a
 * script cannot fill the leads table. The honeypot and the timing check still
 * do most of the anti-spam work (docs/05 section 4.1); this is the backstop
 * for volume.
 */
export const PUBLIC_WRITE_THROTTLE: ThrottleOverride = {
  default: { limit: 5, ttl: seconds(60) },
};

/**
 * Unauthenticated reads that a person might legitimately repeat, such as
 * re-scoring to see how an answer changes the result.
 */
export const PUBLIC_READ_THROTTLE: ThrottleOverride = {
  default: { limit: 10, ttl: seconds(60) },
};
