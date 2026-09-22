import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Ported from the demo's `.btn` family.
 *
 * Two details carried over deliberately:
 *  - min-height 52px (44px for sm). Both clear the 44px tap target minimum,
 *    which is the real constraint on a mid-tier Android (docs/05 section 2.3).
 *  - The ghost variant borders on --field, not --line. --field is the token
 *    that satisfies WCAG 1.4.11 non-text contrast; --line is decorative and
 *    would fail against the background.
 */
const button = cva(
  [
    'inline-flex items-center justify-center gap-[0.5em]',
    'rounded-full border-[1.5px] border-transparent',
    'text-center font-semibold leading-tight no-underline',
    'cursor-pointer transition-[background-color,border-color,color] duration-200',
    'disabled:cursor-not-allowed disabled:opacity-55',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand hover:bg-brand-hover',
        ghost: 'text-ink border-field hover:border-ink bg-transparent',
        accent: 'bg-accent text-on-accent hover:brightness-95',
      },
      size: {
        md: 'min-h-[52px] px-6 py-[13px] text-base',
        sm: 'min-h-[44px] px-[18px] py-[9px] text-[0.95rem]',
      },
      full: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', full: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  /**
   * Render as the child element instead of a <button>. Use for links that look
   * like buttons, so a navigation stays an <a> and keeps its right-click,
   * middle-click and "open in new tab" behaviour.
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      // An unspecified type inside a form defaults to "submit", which is how
      // a decorative button ends up submitting the lead form.
      {...(asChild ? {} : { type: type ?? 'button' })}
      className={cn(button({ variant, size, full }), className)}
      {...props}
    />
  );
});

export { button as buttonVariants };
