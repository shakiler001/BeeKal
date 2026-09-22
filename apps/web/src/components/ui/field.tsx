import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

/**
 * Form primitives, ported from the demo's `.field` family.
 *
 * Three things carried over that are easy to lose in a rewrite:
 *  - Controls border on --field, which exists to satisfy WCAG 1.4.11 non-text
 *    contrast. A lighter border looks nicer and fails the audit.
 *  - The error element is wired via aria-describedby and carries role="alert",
 *    so a screen reader hears the message when it appears.
 *  - An empty error renders nothing at all, so the layout does not reserve a
 *    gap that reads as a missing label.
 */

const controlBase = [
  'w-full rounded-[var(--r-sm)] border border-field bg-surface',
  'px-[14px] py-[12px] text-base text-ink',
  'transition-colors duration-150',
  'placeholder:text-ink-2/70',
  'focus:border-brand',
  'aria-[invalid=true]:border-danger',
  'disabled:opacity-60 disabled:cursor-not-allowed',
].join(' ');

export function Field({
  label,
  htmlFor,
  error,
  optional,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  error?: string | undefined;
  optional?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-[5px]', className)}>
      <label htmlFor={htmlFor} className="text-[0.95rem] font-semibold">
        {label}
        {optional && <span className="text-ink-2 font-normal"> (optional)</span>}
      </label>
      {hint && <p className="text-ink-2 text-[0.88rem]">{hint}</p>}
      {children}
      <ErrorText id={`${htmlFor}-error`}>{error}</ErrorText>
    </div>
  );
}

export function ErrorText({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-danger text-[0.88rem] font-medium">
      {children}
    </p>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, 'min-h-[52px]', className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 5, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, 'resize-y leading-relaxed', className)}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          controlBase,
          'min-h-[52px] cursor-pointer appearance-none',
          'pr-10',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

/**
 * Consent checkbox. 22px is deliberate — the demo sized it so the box itself is
 * a comfortable target next to a two-line label, not a 14px default that misses.
 */
export function Consent({
  id,
  children,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode; error?: string | undefined }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="grid gap-[5px]">
      <label
        htmlFor={inputId}
        className="text-ink-2 flex items-start gap-[11px] text-[0.92rem] leading-snug"
      >
        <input
          id={inputId}
          type="checkbox"
          className="accent-brand mt-px size-[22px] flex-none"
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <span>{children}</span>
      </label>
      <ErrorText id={`${inputId}-error`}>{error}</ErrorText>
    </div>
  );
}
