import { NextResponse } from 'next/server';
import { LoginSchema } from '@beekal/contracts';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

/**
 * Login proxy. The session cookie the API sets is passed straight through, so
 * it stays httpOnly and same-origin — the browser never sees a token in JS.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Enter your email and password' }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
      'user-agent': request.headers.get('user-agent') ?? '',
    },
    body: JSON.stringify(parsed.data),
  });

  const payload = (await upstream.json().catch(() => ({}))) as { message?: string };

  const response = NextResponse.json(
    upstream.ok ? { ok: true } : { message: payload.message ?? 'Sign in failed' },
    { status: upstream.status },
  );

  const setCookie = upstream.headers.getSetCookie();
  for (const cookie of setCookie) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}
