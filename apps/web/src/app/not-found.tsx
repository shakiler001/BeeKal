import Link from 'next/link';
import { BeeMark } from '@/components/brand';
import { Button } from '@/components/ui';

/**
 * A 404 that is branded and gives a route back, rather than a dead end
 * (docs/05 section 7).
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="bg-bg grid min-h-dvh place-items-center px-[var(--gut)] py-20 text-center"
    >
      <div className="max-w-[46ch]">
        <BeeMark title={null} className="mx-auto h-14 w-auto" />

        <p className="text-brand mt-8 text-[0.8rem] font-bold tracking-[0.09em] uppercase">404</p>
        <h1 className="text-heading mt-3 text-[clamp(1.9rem,1.5rem+2vw,2.8rem)] leading-tight font-extrabold tracking-[-0.04em]">
          That page is not here.
        </h1>
        <p className="text-ink-2 mt-4 leading-relaxed">
          The link may be old, or the page may have moved. Everything Beekal does starts from one of
          these.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to the homepage</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/assessment">The assessment</Link>
          </Button>
        </div>

        <p className="text-ink-2 mt-8 text-[0.95rem]">
          Looking for something specific?{' '}
          <Link href="/contact" className="text-ink underline underline-offset-4">
            Ask us
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
