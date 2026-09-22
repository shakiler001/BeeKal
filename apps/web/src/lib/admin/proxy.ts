import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

/**
 * Forwards an admin mutation to the API with the session cookie attached.
 *
 * Deliberately thin: the API owns authorization, so this must not try to
 * second-guess it. Duplicating permission logic here would create two places
 * to get it wrong.
 */
export async function proxyToApi(
  request: Request,
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const body = method === 'DELETE' ? undefined : await request.text();

  const upstream = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
    },
    ...(body ? { body } : {}),
  });

  const payload: unknown = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
