'use client';

import { AdminErrorCard } from '@/features/admin/admin-error-card';

/**
 * The boundary for the admin PAGES.
 *
 * A failure below the layout keeps the session, so this renders inside the
 * admin chrome and the navigation stays usable. Layout failures are caught one
 * segment up, in `(admin)/error.tsx`.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminErrorCard error={error} reset={reset} />;
}
