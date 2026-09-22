'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { SessionUser } from '@beekal/contracts';
import { BeeMark } from '@/components/brand';
import { ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * The admin shell.
 *
 * Navigation is built from the session's permission map, so a Sales user's
 * admin is genuinely a sales tool rather than a mostly-disabled version of
 * someone else's (docs/04 section 4). A section the user cannot use does not
 * appear at all.
 */

interface NavItem {
  href: string;
  label: string;
  /** Shown only if the user holds at least one of these. */
  permissions: string[];
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', permissions: [] },
  { href: '/admin/leads', label: 'Leads', permissions: ['lead:read'] },
  {
    href: '/admin/content',
    label: 'Content',
    permissions: ['solution:read', 'case_study:read', 'faq:read', 'problem:read'],
  },
  { href: '/admin/people', label: 'People', permissions: ['user:read', 'role:read'] },
  { href: '/admin/settings', label: 'Settings', permissions: ['setting:read'] },
  { href: '/admin/audit', label: 'Audit', permissions: ['audit:read'] },
];

export function AdminShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = NAV.filter(
    (item) =>
      item.permissions.length === 0 || item.permissions.some((p) => p in session.permissions),
  );

  return (
    <div className="bg-bg-alt min-h-dvh">
      <header className="bg-surface border-line sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-5">
          <Link href="/admin" className="flex flex-none items-center gap-2.5">
            <BeeMark title={null} className="h-7 w-auto" />
            <span className="font-display text-[0.95rem] font-bold tracking-tight">
              Beekal <span className="text-ink-2 font-medium">Admin</span>
            </span>
          </Link>

          <nav aria-label="Admin" className="ml-6 hidden items-center gap-1 md:flex">
            {visible.map((item) => {
              const active =
                item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-[var(--r-sm)] px-3 py-2 text-[0.92rem] font-medium transition-colors',
                    active ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-ink-2 hidden text-[0.88rem] sm:block">
              {session.name}
              <span className="text-ink-2/70"> · {session.roles.join(', ')}</span>
            </span>
            <ThemeToggle />
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="border-field text-ink-2 hover:text-ink hover:border-ink min-h-9 rounded-full border px-3 text-[0.88rem] font-medium transition-colors"
              >
                Sign out
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Menu'}
              className="border-field text-ink grid size-9 place-items-center rounded-full border md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div id="admin-mobile-nav" hidden={!menuOpen} className="border-line border-t md:hidden">
          <nav aria-label="Admin, mobile" className="grid gap-1 px-5 py-3">
            {visible.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-ink hover:bg-bg-alt flex min-h-11 items-center rounded-[var(--r-sm)] px-3 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1400px] px-5 py-8">
        {children}
      </main>
    </div>
  );
}
