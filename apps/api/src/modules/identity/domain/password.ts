/**
 * Password rules.
 *
 * Length over composition: NIST and every study since agree that forced symbol
 * classes produce predictable substitutions ("P@ssw0rd!") while long
 * passphrases resist attack. So we require length, ban the obvious, and
 * otherwise stay out of the way.
 */

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

const BANNED = [
  'password',
  'beekal',
  '123456',
  'qwerty',
  'letmein',
  'welcome',
  'admin',
  'changeme',
];

export type PasswordCheck = { ok: true } | { ok: false; reason: string };

export function checkPassword(password: string, email?: string): PasswordCheck {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `Use at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, reason: 'That is longer than we can store' };
  }

  const lower = password.toLowerCase();

  if (BANNED.some((b) => lower.includes(b))) {
    return { ok: false, reason: 'That contains a word attackers try first' };
  }

  // The local part of the user's own address is the single most guessable
  // thing about them.
  const localPart = email?.split('@')[0]?.toLowerCase();
  if (localPart && localPart.length >= 4 && lower.includes(localPart)) {
    return { ok: false, reason: 'Do not use your email address in your password' };
  }

  // A single repeated character is long but not strong.
  if (new Set(password).size < 5) {
    return { ok: false, reason: 'Use a greater variety of characters' };
  }

  return { ok: true };
}
