'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Sticky mobile CTA, ported from the demo. It is the highest-converting element
 * on mobile, so it stays.
 *
 * Appears after the hero has scrolled past, and hides near the footer so it
 * never covers the form it is pointing at. aria-hidden while off-screen, so a
 * screen reader does not announce a control that is not there.
 */
export function StickyDock() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const nearBottom = y + window.innerHeight > document.body.scrollHeight - 700;
      setVisible(y > 600 && !nearBottom);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 lg:hidden',
        'bg-bg/95 border-line border-t backdrop-blur-md',
        'px-[var(--gut)] pt-3',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        'transition-transform duration-300',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <Button asChild full>
        <Link href="/contact?intent=assessment" tabIndex={visible ? 0 : -1}>
          Request an assessment
        </Link>
      </Button>
    </div>
  );
}
