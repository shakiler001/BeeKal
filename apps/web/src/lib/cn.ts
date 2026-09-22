import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 *
 * Without twMerge, `cn('p-4', 'p-6')` emits both and the winner depends on CSS
 * source order — which makes a variant override unpredictable.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
