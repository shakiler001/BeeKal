'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand';
import { Button, ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Five nav items maximum. A long nav is a company that has not decided
 * (docs/02 section 2). The /problems/* pages are deliberately not here — they
 * are landing pages for cold traffic, reached from the homepage cards.
 */
const NAV = [
  { href: '/solutions', label: 'Solutions' },
  { href: '/work', label: 'Work' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/method', label: 'Method' },
  { href: '/insights', label: 'Insights' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on navigation, or the menu stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes and returns focus to the control that opened it.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="bg-bg/90 border-line sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-[var(--head)] w-[min(1200px,100%-2*var(--gut))] items-center gap-4">
        <Link href="/" aria-label="Beekal, home" className="flex-none">
          <Logo title={null} className="h-8 w-auto sm:h-9" />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 text-[0.97rem] font-medium transition-colors',
                  active ? 'text-brand' : 'text-ink-2 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={cn('flex items-center gap-2', 'ml-auto lg:ml-3')}>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/contact?intent=assessment">Request an assessment</Link>
          </Button>
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Menu'}
            className="border-field text-ink hover:border-ink grid size-11 place-items-center rounded-full border transition-colors lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="border-line bg-bg border-t lg:hidden"
      >
        <nav aria-label="Main, mobile" className="mx-auto w-[min(1200px,100%-2*var(--gut))] py-4">
          <ul className="grid gap-1">
            {[
              ...NAV,
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ink hover:bg-bg-alt flex min-h-12 items-center rounded-[var(--r-sm)] px-3 font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild full className="mt-3 sm:hidden">
            <Link href="/contact?intent=assessment">Request an assessment</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
