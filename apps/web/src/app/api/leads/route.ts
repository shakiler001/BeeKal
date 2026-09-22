import { NextResponse } from 'next/server';
import { LeadCreateSchema } from '@beekal/contracts';

/**
 * BFF proxy to the API.
 *
 * The browser never talks to the API directly and never holds a token
 * (docs/03 section 5). Validating here as well as in the API is not redundant:
 * it rejects obvious junk before it costs a network hop, and it keeps the two
 * apps honest about sharing one schema.
 */

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = LeadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass the real client address through, so rate limiting and the audit
        // trail see the visitor rather than this container.
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
        'user-agent': request.headers.get('user-agent') ?? '',
      },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Do not leak the upstream body: it can carry internal detail.
      return NextResponse.json(
        { message: 'We could not record that. Please email us directly.' },
        { status: res.status === 429 ? 429 : 502 },
      );
    }

    return NextResponse.json(await res.json(), { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'We could not record that. Please email us directly.' },
      { status: 502 },
    );
  }
}
