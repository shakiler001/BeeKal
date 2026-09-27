import { METHOD } from '@/content/site';

function MethodIcon({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-10"
    >
      {index === 0 && (
        <>
          <circle cx="27" cy="27" r="14" />
          <path d="m38 38 12 12" />
          <circle cx="23" cy="23" r="2" fill="var(--accent)" stroke="none" />
          <circle cx="32" cy="29" r="2" fill="var(--accent)" stroke="none" />
        </>
      )}
      {index === 1 && (
        <>
          <path d="M10 17h13l13 15h17M10 32h43M10 47h13l13-15" />
          <circle cx="53" cy="32" r="3" fill="var(--accent)" stroke="none" />
        </>
      )}
      {index === 2 && (
        <>
          <rect x="25" y="25" width="14" height="14" rx="3" />
          <path d="M32 25V12M32 39v13M25 32H12m27 0h13" />
          <circle cx="32" cy="10" r="3" fill="var(--accent)" stroke="none" />
          <circle cx="54" cy="32" r="3" fill="var(--accent)" stroke="none" />
          <circle cx="32" cy="54" r="3" fill="var(--accent)" stroke="none" />
          <circle cx="10" cy="32" r="3" fill="var(--accent)" stroke="none" />
        </>
      )}
      {index === 3 && (
        <>
          <path d="M49 27a18 18 0 0 0-30-9l-5 5m1-10v10h10M15 37a18 18 0 0 0 30 9l5-5m-1 10V41H39" />
          <circle cx="32" cy="32" r="4" fill="var(--accent)" stroke="none" />
        </>
      )}
      {index === 4 && (
        <>
          <path d="M11 49V16m0 33h43M17 41l11-10 8 5 13-17m-9 0h9v9" />
          <circle cx="28" cy="31" r="3" fill="var(--accent)" stroke="none" />
        </>
      )}
    </svg>
  );
}

/** One connected operating loop, not five unrelated service cards. */
export function MethodFlow() {
  return (
    <ol
      aria-label="Five-step Beekal method"
      className="border-line bg-bg-alt mt-11 grid overflow-hidden rounded-[var(--r-lg)] border md:grid-cols-2 lg:grid-cols-5"
    >
      {METHOD.map((step, index) => (
        <li
          key={step.n}
          className="border-line relative flex flex-col border-b p-6 last:border-b-0 md:odd:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
        >
          <div className="flex items-center justify-between">
            <span className="bg-surface text-brand border-line grid size-16 place-items-center rounded-[var(--r-sm)] border">
              <MethodIcon index={index} />
            </span>
            <span aria-hidden="true" className="text-brand text-2xl font-light">
              {index === METHOD.length - 1 ? (
                '↺'
              ) : (
                <>
                  <span className="lg:hidden">↓</span>
                  <span className="hidden lg:inline">→</span>
                </>
              )}
            </span>
          </div>
          <span className="text-brand tabular mt-7 text-[0.75rem] font-bold tracking-[0.09em] uppercase">
            Step {String(step.n).padStart(2, '0')}
          </span>
          <h2 className="font-display mt-2 text-[1.18rem] font-semibold tracking-[-0.02em]">
            {step.name}
          </h2>
          <p className="text-ink-2 mt-2 text-[0.91rem] leading-[1.55]">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
