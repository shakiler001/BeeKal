import { NextResponse } from 'next/server';
import { ScoreSubmitSchema } from '@beekal/contracts';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

/** Persists a completed score so the result becomes shareable. */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = ScoreSubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Check your answers' },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(`${API_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    // The score is already on screen. Failing to persist it costs the share
    // link, not the result, so the tool must not present this as a failure.
    return NextResponse.json({ message: 'Could not save the result' }, { status: 502 });
  }
}
