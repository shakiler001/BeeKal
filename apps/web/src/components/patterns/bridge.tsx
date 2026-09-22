import Link from 'next/link';

/**
 * The "next" link between sections, ported from the demo's `.bridge`.
 *
 * It tells the reader what comes next and why they would want it, which is what
 * separates it from a generic "learn more". The demo did this well and it is a
 * big part of why the long page stayed readable.
 */
export function Bridge({ href, label, children }: { href: string; label?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-ink group mt-[clamp(22px,2.4vw,32px)] inline-flex min-h-11 max-w-[42ch] items-center gap-3 px-1 py-3.5"
    >
      <span className="bg-brand-soft text-brand grid size-[34px] flex-none place-items-center rounded-full transition-transform duration-200 group-hover:translate-y-0.5">
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </span>
      <span className="block">
        <em className="text-ink-2 mb-0.5 block text-[0.9rem] font-medium not-italic">
          {label ?? 'Next'}
        </em>
        <span className="font-display block text-[1.02rem] leading-snug font-semibold tracking-[-0.015em]">
          {children}
        </span>
      </span>
    </Link>
  );
}
