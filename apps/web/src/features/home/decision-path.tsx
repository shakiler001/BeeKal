import Link from 'next/link';
import type { Solution } from '@/content/solutions';
import type { AssessmentOffer } from '@/content/site';
import { Button, Eyebrow, Section, SectionHeader, Wrap } from '@/components/ui';

function ProcessMap() {
  return (
    <svg viewBox="0 0 280 120" className="h-32 w-full" aria-hidden="true">
      <path
        d="M48 63h54m46 0h46m30 0h20"
        fill="none"
        stroke="white"
        strokeOpacity=".55"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      <rect
        x="12"
        y="35"
        width="68"
        height="56"
        rx="10"
        fill="white"
        fillOpacity=".12"
        stroke="white"
        strokeOpacity=".55"
      />
      <rect
        x="106"
        y="20"
        width="68"
        height="86"
        rx="10"
        fill="white"
        fillOpacity=".18"
        stroke="white"
        strokeOpacity=".65"
      />
      <rect
        x="200"
        y="35"
        width="68"
        height="56"
        rx="10"
        fill="white"
        fillOpacity=".12"
        stroke="white"
        strokeOpacity=".55"
      />
      <circle cx="46" cy="63" r="7" fill="var(--accent)" />
      <circle cx="140" cy="63" r="7" fill="var(--accent)" />
      <circle cx="234" cy="63" r="7" fill="var(--accent)" />
    </svg>
  );
}

function PriorityMap() {
  return (
    <div aria-hidden="true" className="flex h-32 flex-col justify-center gap-3 px-4">
      {[84, 62, 40].map((width, index) => (
        <div key={width} className="flex items-center gap-3">
          <span className="tabular w-5 text-xs font-bold text-white">0{index + 1}</span>
          <span className="h-2 flex-1 rounded-full bg-white/15">
            <span className="bg-accent block h-full rounded-full" style={{ width: `${width}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function ChoiceMap() {
  return (
    <div aria-hidden="true" className="flex h-32 flex-col justify-center">
      <div className="bg-accent mx-auto size-3 rounded-full" />
      <div className="mx-auto h-5 w-px bg-white/60" />
      <div className="mx-auto h-px w-[55%] bg-white/60" />
      <div className="grid grid-cols-2 gap-3">
        <span className="border-t border-white/25 pt-3 text-center text-sm font-semibold">
          With Beekal
        </span>
        <span className="border-t border-white/25 pt-3 text-center text-sm font-semibold">
          Your team
        </span>
      </div>
    </div>
  );
}

function SolutionName({ name }: { name: string }) {
  const parts = /^(Beekal)\s+(.+)$/i.exec(name.trim());

  return (
    <span className="block">
      {parts && (
        <span className="text-ink-2 block text-[0.72rem] font-semibold tracking-[0.09em]">
          {parts[1]}
        </span>
      )}
      <strong className="font-display text-brand block text-[1.5rem] leading-tight font-bold tracking-[-0.025em]">
        {parts ? parts[2] : name}
      </strong>
    </span>
  );
}

/** The paid diagnostic is the decision product; delivery services come afterward. */
export function DecisionPath({
  assessment,
  solutions,
}: {
  assessment: AssessmentOffer;
  solutions: Solution[];
}) {
  const buildOptions = solutions.filter((solution) => solution.key !== 'care');
  const care = solutions.find((solution) => solution.key === 'care');

  return (
    <>
      <Section tone="band" className="bg-[var(--cobalt)]" id="outcome">
        <Wrap>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <Eyebrow className="text-white">The path forward</Eyebrow>
              <h2 className="max-w-[22ch] text-[clamp(1.85rem,1.4rem+2vw,2.8rem)] leading-[1.1] font-bold tracking-[-0.04em] text-white">
                Know the next move before you pay to build it.
              </h2>
            </div>
            <p className="max-w-[42ch] text-[1.02rem] leading-relaxed text-white/80">
              A paid, fixed-scope Business System Assessment gives you a plan you own—even if
              another team builds it.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {[
              {
                title: 'Trace the real work',
                body: 'Map people, process, systems and handoffs.',
                graphic: <ProcessMap />,
              },
              {
                title: 'Rank the fixes',
                body: 'Get a roadmap ranked by business value.',
                graphic: <PriorityMap />,
              },
              {
                title: 'Choose what happens next',
                body: 'Build with us or your team. The plan stays yours.',
                graphic: <ChoiceMap />,
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="relative flex flex-col rounded-[var(--r-md)] border border-white/25 bg-black/20 p-5 sm:p-6"
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="text-accent absolute top-20 -left-[19px] hidden text-2xl md:block"
                  >
                    →
                  </span>
                )}
                <div className="border-b border-white/20 pb-4">{step.graphic}</div>
                <span className="tabular mt-5 text-[0.8rem] font-bold tracking-[0.12em] text-white">
                  STEP 0{index + 1}
                </span>
                <h3 className="mt-2 text-[1.22rem] font-bold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-white">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-7 border-t border-white/25 pt-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <dl className="grid w-full grid-cols-3 gap-3 sm:max-w-[560px] sm:flex-1 sm:gap-4">
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-[0.78rem] text-white">Typical duration</dt>
                <dd className="font-display text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] font-bold text-white">
                  {assessment.duration}
                </dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-[0.78rem] text-white">Your team’s time</dt>
                <dd className="font-display text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] font-bold text-white">
                  {assessment.clientHours}
                </dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-[0.78rem] text-white">Documents to keep</dt>
                <dd className="font-display tabular text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] font-bold text-white">
                  {assessment.documentCount}
                </dd>
              </div>
            </dl>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-start">
              <Button asChild variant="accent" className="w-full sm:w-auto">
                <Link href="/assessment">See the Assessment</Link>
              </Button>
              <span className="text-[0.78rem] text-white">
                {assessment.priceRange || 'Fixed price, agreed first'}
              </span>
            </div>
          </div>
        </Wrap>
      </Section>

      {solutions.length > 0 && (
        <Section id="solutions">
          <Wrap>
            <SectionHeader
              eyebrow="After the plan"
              title="Use only the help the work calls for."
              lede="Only what the roadmap calls for."
            />

            <ul className="border-line bg-line mt-9 grid gap-px overflow-hidden rounded-[var(--r-lg)] border sm:grid-cols-2">
              {buildOptions.map((solution, index) => (
                <li key={solution.key} className="bg-surface">
                  <Link
                    href={`/solutions/${solution.slug}`}
                    className="group hover:bg-bg-alt flex h-full min-h-32 flex-col justify-between gap-4 p-6 transition-colors sm:p-7"
                  >
                    <span className="text-brand tabular text-[0.8rem] font-bold tracking-[0.1em]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex items-end justify-between gap-4">
                      <span>
                        <SolutionName name={solution.name} />
                        <span className="text-ink-2 mt-1 block text-[0.92rem]">
                          {solution.cardHeadline}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-brand text-xl">
                        ↗
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {care && (
              <Link
                href={`/solutions/${care.slug}`}
                className="border-line hover:border-brand mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[var(--r-md)] border px-6 py-5 transition-colors sm:px-7"
              >
                <span>
                  <SolutionName name={care.name} />
                  <span className="text-ink-2 mt-1 block text-[0.92rem]">
                    {care.cardHeadline}
                  </span>
                </span>
                <span className="text-brand text-[0.9rem] font-semibold">Keep improving ↗</span>
              </Link>
            )}
          </Wrap>
        </Section>
      )}
    </>
  );
}
