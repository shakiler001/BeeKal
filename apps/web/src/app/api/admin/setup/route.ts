import { NextResponse } from 'next/server';
import { SetPasswordSchema } from '@beekal/contracts/auth';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = SetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Check the details' },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_URL}/api/auth/set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
    cache: 'no-store',
  });
  const payload = (await upstream.json().catch(() => ({}))) as { message?: string };
  return NextResponse.json(
    upstream.ok ? { ok: true } : { message: payload.message ?? 'Could not set password' },
    { status: upstream.status },
  );
}
