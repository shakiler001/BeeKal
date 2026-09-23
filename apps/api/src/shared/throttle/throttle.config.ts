import { seconds, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { env } from '../../config/env.js';

/**
 * Rate limits.
 *
 * Three named buckets rather than one global number, because the endpoints
 * being protected fail in different ways:
 *
 *  - `default` guards against a client hammering the API generally.
 *  - `auth` is deliberately tight. Login is the one endpoint where an attacker
 *    gets unlimited free attempts at a secret, and 5 tries a minute makes
 *    online guessing pointless without inconveniencing a person who mistyped.
 *  - `public` covers the unauthenticated write endpoints — the lead form and
 *    the score. Generous enough that a real visitor never sees it, tight
 *    enough that a script cannot fill the leads table.
 *
 * The honeypot and timing check still do most of the anti-spam work
 * (docs/05 section 4.1); this is the backstop for volume.
 */
export function throttleConfig(): ThrottlerModuleOptions {
  const config = env();

  return {
    throttlers: [
      {
        name: 'default',
        ttl: config.RATE_LIMIT_WINDOW_MS,
        limit: config.RATE_LIMIT_MAX,
      },
      { name: 'auth', ttl: seconds(60), limit: 5 },
      { name: 'public', ttl: seconds(60), limit: 10 },
    ],
    errorMessage: 'Too many requests. Wait a moment and try again.',
  };
}
