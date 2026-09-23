'use client';

import Link from 'next/link';
import { Button, Card } from '@/components/ui';

/**
 * What an administrator sees when a request failed in a way that is not
 * "you are signed out".
 *
 * Two callers, deliberately:
 *
 *  - the admin layout renders it directly, as a value, because an error thrown
 *    from a layout during the initial render of a document is caught by no
 *    `error.tsx` at any level and Next serves its own "Application error" page
 *    instead. It has no `reset` to offer, so it offers a link.
 *  - `(admin)/admin/error.tsx` renders it as a boundary fallback for failures
 *    below the layout, where React does give us a retry.
 *
 * The message does not name a cause. In production Next replaces the error
 * message with a digest before it reaches the client, so any specific claim
 * here would be a guess presented as fact. It says what is true of every case
 * that reaches this component — the request did not complete, nothing was
 * written — and offers the actions that help.
 */
export function AdminErrorCard({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
}) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-5">
      <Card padding="lg" className="max-w-[46ch] text-center">
        <h1 className="font-display text-xl font-bold tracking-tight">
          The admin could not load that.
        </h1>
        <p className="text-ink-2 mt-3 leading-relaxed">
          The API is restarting, unreachable, or briefly too busy. Nothing has been saved or lost —
          try again in a moment.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {reset ? (
            <Button onClick={reset}>Try again</Button>
          ) : (
            <Button asChild>
              <Link href="/admin">Try again</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/admin/login">Sign in again</Link>
          </Button>
        </div>

        {error?.digest && (
          <p className="text-ink-2 mt-6 text-[0.8rem]">
            Reference <code className="font-medium">{error.digest}</code> — quote this if you report
            it.
          </p>
        )}
      </Card>
    </div>
  );
}
