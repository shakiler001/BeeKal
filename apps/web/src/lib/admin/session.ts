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
 * Anything else — a 5xx, a 429 — means the API is up and answering, it is just
 * not answering this. An administrator mid-task deserves to know the
 * difference between "sign in again" and "something is wrong", so those are
 * reported rather than disguised as a logout.
 */

export type SessionResult =
  | { status: 'ok'; session: SessionUser }
  /** We could not tell who this is. Treat as signed out. */
  | { status: 'unauthenticated' }
  /** We reached the API and it declined to answer. Not a logout. */
  | { status: 'unavailable'; reason: string };

/**
 * The non-throwing form.
 *
 * Exists because of where the throwing form cannot be used. Next's `error.tsx`
 * never catches the layout of its own segment, and moving the boundary up does
 * not help either: an error thrown from a layout during the initial render of
 * a document escapes the boundaries entirely and Next serves its own
 * "Application error" page. The admin layout is exactly that case — it calls
 * for the session before anything else exists.
 *
 * So the layout asks for a result it can render, rather than throwing one and
 * hoping something downstream catches it. Verified by exhausting the API's
 * rate limit and loading /admin: boundaries at three levels all failed to
 * catch it, and returning a value works.
 */
export async function loadSession(): Promise<SessionResult> {
  try {
    const session = await adminApi.get<SessionUser>('/auth/me');
    return { status: 'ok', session };
  } catch (error) {
    if (cannotIdentify(error)) return { status: 'unauthenticated' };
    return {
      status: 'unavailable',
      reason: error instanceof ApiError ? `${error.status}` : 'unknown',
    };
  }
}

/**
 * The throwing form, for pages.
 *
 * A page sits below the admin layout, so a throw here does reach
 * `(admin)/admin/error.tsx` and renders inside the admin chrome with the
 * navigation still usable.
 */
export async function requireSession(): Promise<SessionUser> {
  const result = await loadSession();

  // Deliberately outside any try. redirect() signals by throwing, and a catch
  // block around it would swallow the navigation.
  if (result.status === 'unauthenticated') redirect('/admin/login');
  if (result.status === 'unavailable') {
    throw new ApiError(
      Number(result.reason) || 503,
      'API_UNAVAILABLE',
      'The API did not answer that request.',
    );
  }

  return result.session;
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
