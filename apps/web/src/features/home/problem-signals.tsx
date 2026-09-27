import Link from 'next/link';
import type { Problem } from '@/content/problems';
import { Button, Eyebrow, Section, SectionHeader, Wrap } from '@/components/ui';

/** Symptoms route to their own pages; the diagram explains why handoffs matter. */
export function ProblemSignals({ problems }: { problems: Problem[] }) {
  return (
    <Section tone="alt" id="problems">
      <Wrap>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow="Find your starting point"
            title="Where does the work get stuck?"
          />
          <Button asChild variant="ghost" size="sm" className="font-display rounded-[var(--r-sm)]">
            <Link href="/score">
              Take the 2-minute score <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <ol className="border-line bg-surface divide-line shadow-card-sm divide-y overflow-hidden rounded-[var(--r-lg)] border">
            {problems.map((problem, index) => (
              <li key={problem.key}>
                <Link
                  href={`/problems/${problem.slug}`}
                  className="group hover:bg-brand-soft focus-visible:bg-brand-soft flex min-h-20 items-center gap-4 px-5 py-4 transition-colors sm:px-7"
                >
                  <span className="text-brand tabular font-display w-9 flex-none text-[0.9rem] font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display min-w-0 flex-1 text-[clamp(1.04rem,0.98rem+0.3vw,1.2rem)] leading-snug font-semibold">
                    {problem.cardHeadline}
                  </span>
                  <span
                    aria-hidden="true"
                    className="border-field text-brand group-hover:border-brand grid size-9 flex-none place-items-center rounded-full border text-lg transition-colors"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="bg-foot relative overflow-hidden rounded-[var(--r-lg)] p-6 text-white sm:p-8">
            <Eyebrow className="text-accent">One everyday example</Eyebrow>
            <h3 className="max-w-[25ch] text-[clamp(1.45rem,1.2rem+0.9vw,2rem)] leading-tight font-bold tracking-tight text-white">
              One request. Four places to look.
            </h3>
            <p className="mt-3 max-w-[38ch] text-[0.94rem] text-white/75">
              The delay lives between tools, not inside them.
            </p>

            <ol className="mt-7 overflow-hidden rounded-[var(--r-sm)] border border-white/20 bg-white/5">
              {['Inbox', 'Spreadsheet', 'Approval thread', 'Report'].map((place, index) => (
                <li
                  key={place}
                  className="flex min-h-[52px] items-center gap-4 border-b border-white/15 px-4 py-2 last:border-b-0"
                >
                  <span className="text-accent tabular w-7 flex-none text-[0.75rem] font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display flex-1 text-[0.96rem] font-medium">{place}</span>
                  {index < 3 && (
                    <span aria-hidden="true" className="text-accent text-lg">
                      ↓
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="text-accent mt-4 text-[0.84rem] font-semibold">
              Three manual handoffs for one answer.
            </p>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
