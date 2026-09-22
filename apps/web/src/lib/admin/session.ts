import { redirect } from 'next/navigation';
import type { SessionUser } from '@beekal/contracts';
import { adminApi, ApiError } from './api';

/**
 * Loads the signed-in user, or sends them to the login page.
 *
 * Every admin page calls this. The permission map it returns is what the UI
 * uses to decide which navigation items and buttons to render, so a user never
 * sees a section they cannot use (docs/04 section 4).
 */
export async function requireSession(): Promise<SessionUser> {
  try {
    return await adminApi.get<SessionUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect('/admin/login');
    }
    throw error;
  }
}

/** Convenience for conditional rendering. */
export function can(session: SessionUser, permission: string): boolean {
  return permission in session.permissions;
}

export function canAny(session: SessionUser, permissions: string[]): boolean {
  return permissions.some((p) => can(session, p));
}
