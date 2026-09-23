'use client';

import Link from 'next/link';
import { Button, Card } from '@/components/ui';

/**
 * Admin error boundary.
 *
 * Without this, a backend that is briefly unreachable shows a raw framework
 * error page to whoever is trying to do their job. This says what happened in
 * a sentence and offers the two things that actually help: retry, or sign in
 * again.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-5">
      <Card padding="lg" className="max-w-[46ch] text-center">
        <h1 className="font-display text-xl font-bold tracking-tight">
          The admin could not load that.
        </h1>
        <p className="text-ink-2 mt-3 leading-relaxed">
          Usually this means the API is restarting or unreachable. Nothing has been lost — try again
          in a moment.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="ghost">
            <Link href="/admin/login">Sign in again</Link>
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
