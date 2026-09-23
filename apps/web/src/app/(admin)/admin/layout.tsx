import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/features/admin/admin-shell';
import { AdminErrorCard } from '@/features/admin/admin-error-card';
import { loadSession } from '@/lib/admin/session';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Beekal Admin' },
  robots: { index: false, follow: false },
};

// Always current, never cached. The headers in next.config add no-store too.
export const dynamic = 'force-dynamic';

/**
 * The layout renders its failure rather than throwing it.
 *
 * An error thrown from a layout during the initial render of a document is not
 * caught by `error.tsx` — not beside it, not at the parent segment, not at the
 * app root. Next serves its own "Application error: a server-side exception
 * has occurred" page instead, which tells an administrator nothing and tells a
 * stranger that an admin exists.
 *
 * So the one call that can fail here asks for a result instead. Children are
 * not rendered when there is no session, which also stops every page below
 * from repeating the same failed request.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await loadSession();

  if (result.status === 'unauthenticated') redirect('/admin/login');

  if (result.status === 'unavailable') {
    return <AdminErrorCard />;
  }

  return <AdminShell session={result.session}>{children}</AdminShell>;
}
