'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bk-theme';

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset['theme'];
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  'aria-hidden': true,
} as const;

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

/**
 * Theme toggle, ported from the demo.
 *
 * Not next-themes: the demo's inline pre-paint script in the root layout
 * already sets data-theme before first paint, and its contract is one attribute
 * plus one localStorage key. Adding a provider on top would mean two sources of
 * truth for the same attribute, and the flash-prevention script would have to
 * agree with a library it does not know about.
 *
 * aria-pressed carries the state; the label says what pressing it will DO,
 * which is what a screen reader user needs to hear.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Starts undefined so server and client markup agree; resolved after mount.
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage. The toggle still works for this
      // visit; it just will not be remembered.
    }
    setTheme(next);
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === undefined ? undefined : isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'border-field text-ink grid size-11 place-items-center rounded-full border',
        'hover:border-ink transition-colors duration-200',
        className,
      )}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
