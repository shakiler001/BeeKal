'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogoWithTagline } from '@/components/brand';
import { Button, ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Six nav items. The rule was five - a long nav is a company that has not
 * decided (docs/02 section 2) - and the maturity score is the deliberate
 * exception, on the founder's call.
 *
 * It earns the slot: it is the only free, instant, no-email thing on the site,
 * and it is the cheapest possible first step for someone not ready to ask for
 * an assessment. It sits last, next to the paid call to action, so the visitor
 * who flinches at "Request an assessment" has something to do instead of
 * leaving. `highlight` gives it the amber dot; nothing else in the nav has one,
 * which is the whole point and also why there must never be a second.
 *
 * The /problems/* pages are still deliberately absent - they are landing pages
 * for cold traffic, reached from the homepage cards.
 */
const NAV = [
  { href: '/solutions', label: 'Solutions', highlight: false },
  { href: '/work', label: 'Work', highlight: false },
  { href: '/assessment', label: 'Assessment', highlight: false },
  { href: '/method', label: 'Method', highlight: false },
  { href: '/insights', label: 'Insights', highlight: false },
  { href: '/score', label: 'Maturity score', highlight: true },
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
          <LogoWithTagline title={null} />
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
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.97rem] font-medium transition-colors',
                  active ? 'text-brand' : 'text-ink-2 hover:text-ink',
                  item.highlight && !active && 'text-ink',
                )}
              >
                {item.highlight && (
                  <span aria-hidden className="bg-accent size-1.5 flex-none rounded-full" />
                )}
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
