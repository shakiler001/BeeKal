import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

/**
 * Opaque token primitives.
 *
 * These live in `shared` rather than in a module because two modules need
 * them for opposite halves of the same job: identity ISSUES tokens, access
 * VERIFIES them. Putting them in either module would force the other to reach
 * across a boundary.
 *
 * The raw token goes to the browser in an httpOnly cookie and is NEVER stored.
 * We keep only its SHA-256 hash, so a database leak does not hand an attacker
 * live sessions. SHA-256 rather than Argon2 because the token is already 256
 * bits of entropy — it needs no stretching, and lookups must be fast.
 */

const TOKEN_BYTES = 32;

export interface IssuedToken {
  /** Goes in the cookie. Shown once, never persisted. */
  raw: string;
  /** Goes in the database. */
  hash: string;
}

export function issueToken(): IssuedToken {
  const raw = randomBytes(TOKEN_BYTES).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Constant-time comparison, so timing cannot reveal how much matched. */
export function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function expiryFrom(now: Date, ttlHours: number): Date {
  return new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
}

export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}

/**
 * Sliding expiry: extend only once the session is past its halfway point.
 * Rewriting the row on every request would make each page view a database
 * write for no benefit.
 */
export function shouldExtend(expiresAt: Date, now: Date, ttlHours: number): boolean {
  const remaining = expiresAt.getTime() - now.getTime();
  return remaining < (ttlHours * 60 * 60 * 1000) / 2;
}
