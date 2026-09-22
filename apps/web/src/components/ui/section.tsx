import { cva, type VariantProps } from 'class-variance-authority';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Layout primitives, ported from the demo's `.wrap`, `.sec` and `.eyebrow`.
 *
 * `--sec` is one vertical rhythm for every section, and `--gut` one horizontal
 * gutter. Sections that set their own padding are how a page stops looking
 * composed, so these are the only two spacing decisions a section makes.
 */

export function Wrap({
  className,
  as: Comp = 'div',
  ...props
}: HTMLAttributes<HTMLDivElement> & { as?: ElementType }) {
  return <Comp className={cn('mx-auto w-[min(1200px,100%-2*var(--gut))]', className)} {...props} />;
}

const section = cva('py-[var(--sec)]', {
  variants: {
    tone: {
      default: 'bg-bg',
      alt: 'bg-bg-alt',
      /** Inverted band, for the transformation and final-CTA sections. */
      band: 'bg-foot text-white',
    },
  },
  defaultVariants: { tone: 'default' },
});

export interface SectionProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof section> {
  as?: ElementType;
}

export function Section({ className, tone, as: Comp = 'section', ...props }: SectionProps) {
  return <Comp className={cn(section({ tone }), className)} {...props} />;
}

/**
 * The tracked, brand-coloured kicker that signals a new section. The amber rule
 * before it is part of the mark — it is what stops the eyebrow reading as just
 * small text.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'mb-3.5 flex items-center gap-[9px]',
        'text-brand text-[0.8rem] leading-none font-bold tracking-[0.09em] uppercase',
        'before:bg-accent before:h-[3px] before:w-[22px] before:flex-none before:rounded-full before:content-[""]',
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Eyebrow + heading + optional lede. One job per section, stated at the top. */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  className,
  headingLevel: Heading = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  headingLevel?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className={cn('max-w-[46ch]', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading className="text-[clamp(1.75rem,1.3rem+2vw,2.6rem)] leading-[1.12] font-bold tracking-[-0.035em]">
        {title}
      </Heading>
      {lede && <p className="text-ink-2 mt-4 text-[1.05rem] leading-relaxed">{lede}</p>}
    </div>
  );
}
