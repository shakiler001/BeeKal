import { redirect } from 'next/navigation';
import type { SessionUser } from '@beekal/contracts/auth';
import { adminApi, ApiError } from './api';

/**
 * Loads the signed-in user, or sends them to the login page.
 *
 * Every admin page calls this. The permission map it returns is what the UI
 * uses to decide which navigation items and buttons to render, so a user never
 * sees a section they cannot use (docs/04 section 4).
 *
 * The rule for failures: if we CANNOT ESTABLISH WHO THIS IS, they are not
 * signed in, and the answer is the login page. That covers a rejected session
 * (401/403), a missing endpoint (404, which in practice means a stale
 * deployment), and an unreachable API — in all three we do not know who is
 * asking, and an error page shown to someone who is not signed in leaks that
 * an admin exists while helping them not at all.
 *
 * A 5xx is different: the API is up and answering, it is just broken. That
 * reaches the error boundary, because an administrator mid-task deserves to
 * know the difference between "sign in again" and "something is wrong".
 */
export async function requireSession(): Promise<SessionUser> {
  let session: SessionUser | undefined;

  try {
    session = await adminApi.get<SessionUser>('/auth/me');
  } catch (error) {
    if (!cannotIdentify(error)) throw error;
  }

  // Deliberately outside the try. redirect() signals by throwing, and a catch
  // block above it would swallow the navigation.
  if (!session) redirect('/admin/login');

  return session;
}

function cannotIdentify(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403 || error.status === 404;
  }
  // Not an ApiError means the request never reached the API at all:
  // connection refused, DNS failure, timeout.
  return true;
}

/** Convenience for conditional rendering. */
export function can(session: SessionUser, permission: string): boolean {
  return permission in session.permissions;
}

export function canAny(session: SessionUser, permissions: string[]): boolean {
  return permissions.some((p) => can(session, p));
}
