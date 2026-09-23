'use client';

import Link from 'next/link';
import { Button, Card } from '@/components/ui';

/**
 * The site-wide error boundary for page-level failures.
 *
 * There was none before, so a failure on any marketing route fell through to
 * the framework's own error page. This catches errors raised while rendering a
 * page below `app/`.
 *
 * It does NOT catch a layout. `error.tsx` never catches the layout of its own
 * segment, and a layout that throws during the initial render of a document
 * escapes the boundaries above it too - verified against the admin layout,
 * where boundaries at three levels all failed to catch it. Layouts that load
 * data handle their own failures by rendering them; see the admin layout.
 *
 * Deliberately generic: this fires across the whole site, and in production
 * Next replaces the error message with a digest before it reaches the client,
 * so naming a cause here would be a guess presented as fact.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-5">
      <Card padding="lg" className="max-w-[46ch] text-center">
        <h1 className="font-display text-xl font-bold tracking-tight">
          Something went wrong loading that.
        </h1>
        <p className="text-ink-2 mt-3 leading-relaxed">
          The page could not be built just now. Nothing has been saved or lost — trying again
          usually works.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to the homepage</Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-ink-2 mt-6 text-[0.8rem]">
            Reference <code className="font-medium">{error.digest}</code> — quote this if you report
            it.
          </p>
        )}
      </Card>
    </div>
  );
}
