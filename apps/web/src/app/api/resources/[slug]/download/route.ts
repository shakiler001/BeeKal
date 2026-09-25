import { NextResponse } from 'next/server';
import { EmailSchema } from '@beekal/contracts';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Enter a valid email address' }, { status: 400 });
  }
  const email = EmailSchema.safeParse((body as { email?: unknown } | null)?.email);
  if (!email.success) {
    return NextResponse.json({ message: 'Enter a valid email address' }, { status: 422 });
  }
  try {
    const res = await fetch(`${API_URL}/api/public/content/resources/${slug}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
      },
      body: JSON.stringify({ email: email.data }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404)
      return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
    if (!res.ok) {
      return NextResponse.json(
        {
          message:
            res.status === 429
              ? 'Please wait a moment and try again.'
              : 'The resource is unavailable right now.',
        },
        { status: res.status === 429 ? 429 : 502 },
      );
    }
    return NextResponse.json(await res.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { message: 'The resource is unavailable right now.' },
      { status: 502 },
    );
  }
}
