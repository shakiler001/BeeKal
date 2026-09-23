import { NextResponse } from 'next/server';
import { ScoreReportRequestSchema } from '@beekal/contracts';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = ScoreReportRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Check your email address' },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(`${API_URL}/api/score/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Could not send that' }, { status: 502 });
  }
}
