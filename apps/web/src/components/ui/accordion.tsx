import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Accordion built on native <details>, ported from the demo's `.acc`.
 *
 * Deliberately NOT a Radix Accordion. The demo's version works with JavaScript
 * disabled, and the FAQ is the content most likely to be read by someone on a
 * bad connection where the JS has not arrived. Native <details> also gets
 * in-page find for free, which matters on a page of seven FAQ answers — a
 * scripted accordion hides its collapsed text from Ctrl+F.
 *
 * Radix is still the right answer for tabs, where there is no native element.
 */
export function Accordion({
  summary,
  children,
  defaultOpen = false,
  className,
  count,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Optional trailing count, e.g. "11 documents". */
  count?: ReactNode;
}) {
  return (
    <details open={defaultOpen} className={cn('border-line group border-b', className)}>
      <summary
        className={cn(
          'flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-[13px]',
          'font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.015em]',
          '[&::-webkit-details-marker]:hidden',
          // The chevron is a rotated corner, which stays crisp at any zoom
          // where an icon font would not.
          'after:border-brand after:size-3 after:flex-none after:border-r-2 after:border-b-2 after:content-[""]',
          'after:translate-x-[-3px] after:translate-y-[-3px] after:rotate-45',
          'after:transition-transform after:duration-200',
          'group-open:after:translate-y-[1px] group-open:after:rotate-[225deg]',
        )}
      >
        <span>{summary}</span>
        {count && <span className="text-ink-2 mr-2 ml-auto text-sm font-medium">{count}</span>}
      </summary>
      <div className="text-ink-2 pb-4 leading-relaxed [&_p+p]:mt-3">{children}</div>
    </details>
  );
}
