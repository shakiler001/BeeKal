import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

/**
 * Logout. A plain form posts here, so signing out works with JavaScript
 * disabled — which matters on the one screen you most want to be able to leave.
 */
export async function POST() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const upstream = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie: cookieHeader },
  }).catch(() => null);

  // request.url can contain the container bind address (0.0.0.0), which is
  // not a usable browser destination. Redirect to the configured public URL.
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const response = NextResponse.redirect(new URL('/admin/login', appUrl), { status: 303 });

  // Clear locally regardless of what upstream said. A failed logout that
  // leaves the cookie in place is worse than a session row that lingers.
  response.cookies.delete('bk_session');

  for (const cookie of upstream?.headers.getSetCookie() ?? []) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}
