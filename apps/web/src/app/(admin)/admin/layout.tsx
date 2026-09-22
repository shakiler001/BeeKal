import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/admin-shell';
import { requireSession } from '@/lib/admin/session';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Beekal Admin' },
  robots: { index: false, follow: false },
};

// Always current, never cached. The headers in next.config add no-store too.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AdminShell session={session}>{children}</AdminShell>;
}
