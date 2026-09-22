/**
 * Bot defence without a CAPTCHA.
 *
 * A CAPTCHA is a third-party dependency, an accessibility tax and a conversion
 * tax (docs/05 section 4.1). A honeypot plus a timing check plus rate limiting
 * stops the volume that actually reaches a B2B contact form.
 */

export interface SpamCheckInput {
  /** Honeypot field. A person cannot see it, so anything here is a bot. */
  website?: string | undefined;
  /** When the form was rendered, from the client. */
  renderedAt?: number | undefined;
  now: number;
}

export type SpamVerdict = { spam: false } | { spam: true; reason: string };

/** Nobody reads the questions and writes a real answer in under four seconds. */
const MIN_FILL_MS = 4_000;

/**
 * A stale timestamp usually means a form left open for a day, not an attack —
 * so it is allowed. Only an implausibly FAST submission is rejected.
 */
export function checkSpam(input: SpamCheckInput): SpamVerdict {
  if (input.website && input.website.trim().length > 0) {
    return { spam: true, reason: 'honeypot' };
  }

  if (typeof input.renderedAt === 'number') {
    const elapsed = input.now - input.renderedAt;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
      return { spam: true, reason: 'too-fast' };
    }
  }

  return { spam: false };
}
