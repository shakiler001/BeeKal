import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { isContentTag } from '@/lib/content/tags';

/**
 * Publishing tells the site to forget what it cached.
 *
 * The API calls this after a content row changes, through the outbox, so a
 * revalidation that fails is retried rather than lost (FLW-05). That makes the
 * call at-least-once, which is fine: throwing a cache entry away twice costs a
 * regeneration.
 *
 * Authentication is a shared secret rather than a session, because the caller
 * is the API itself and has no user. Without it this endpoint lets anyone on
 * the internet drop the site's cache repeatedly, which is a cheap way to make
 * every request regenerate a page.
 *
 * The secret is compared in constant time. A plain `!==` leaks its length and
 * then its contents to anyone willing to time the responses, and the whole
 * comparison costs nothing here.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secureEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env['REVALIDATE_SECRET'];

  // Refuse rather than accept everything when unconfigured. An endpoint that
  // stops checking a credential because the credential is missing is worse
  // than one that is switched off.
  if (!secret) {
    console.error('[revalidate] REVALIDATE_SECRET is not set — refusing.');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const offered = request.headers.get('x-revalidate-secret') ?? '';
  if (!secureEquals(offered, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let tag: unknown;
  try {
    ({ tag } = (await request.json()) as { tag?: unknown });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof tag !== 'string' || !isContentTag(tag)) {
    // Named explicitly so a typo in a tag fails visibly instead of quietly
    // revalidating nothing and looking like a caching bug for a week.
    return NextResponse.json({ error: `Unknown tag: ${String(tag)}` }, { status: 400 });
  }

  revalidateTag(tag);

  // Not logged here. The API logs the same event with the reason attached when
  // the relay delivers it, and one line per publish in one place beats two.
  return NextResponse.json({ ok: true, tag, at: new Date().toISOString() });
}
