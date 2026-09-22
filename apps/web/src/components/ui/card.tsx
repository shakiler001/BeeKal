import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const card = cva('rounded-[var(--r-md)] border', {
  variants: {
    tone: {
      surface: 'bg-surface border-line',
      alt: 'bg-bg-alt border-line',
      outline: 'border-field bg-transparent',
    },
    elevation: {
      none: '',
      sm: 'shadow-card-sm',
      md: 'shadow-card',
    },
    padding: {
      none: '',
      sm: 'p-5',
      md: 'p-6 sm:p-7',
      lg: 'p-7 sm:p-9',
    },
    interactive: {
      // Only for cards that are genuinely a link. A hover state on something
      // unclickable is a promise the card cannot keep.
      true: 'hover:border-line-2 transition-colors duration-200',
      false: '',
    },
  },
  defaultVariants: { tone: 'surface', elevation: 'sm', padding: 'md', interactive: false },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof card> {}

export function Card({ className, tone, elevation, padding, interactive, ...props }: CardProps) {
  return (
    <div className={cn(card({ tone, elevation, padding, interactive }), className)} {...props} />
  );
}

/**
 * A stat, ported from the demo's `.metric`. Tabular numerals are the point:
 * without them, digits of different widths make a column of figures jitter.
 */
export function Metric({
  value,
  label,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-line-2 border-t py-3 first-of-type:border-t-0 first-of-type:pt-0',
        className,
      )}
    >
      <b className="text-brand tabular block text-[clamp(1.4rem,1.1rem+1vw,1.85rem)] leading-tight font-bold tracking-[-0.03em]">
        {value}
      </b>
      <span className="text-ink-2 mt-[3px] block text-[0.93rem]">{label}</span>
    </div>
  );
}

/**
 * An impact/effort meter, ported from the demo's `.dots`. The accessible name
 * carries the value — the dots themselves are decoration and are hidden.
 */
export function Dots({ value, max = 5, label }: { value: number; max?: number; label: string }) {
  return (
    <span className="flex gap-1" role="img" aria-label={`${label} ${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i
          key={i}
          aria-hidden
          className={cn('size-[9px] rounded-full', i < value ? 'bg-brand' : 'bg-field')}
        />
      ))}
    </span>
  );
}

/** Pill, ported from `.tags li`. Borders on --field so the edge stays visible. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'bg-surface border-field rounded-full border px-[15px] py-[7px] text-[0.95rem]',
        className,
      )}
    >
      {children}
    </span>
  );
}
