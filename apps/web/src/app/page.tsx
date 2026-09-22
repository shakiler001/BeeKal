import type { HealthCheck, HealthResponse } from '@beekal/contracts';

export const dynamic = 'force-dynamic';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

const PHASES = [
  { n: 0, name: 'Foundation', current: true },
  { n: 1, name: 'Design system', current: false },
  { n: 2, name: 'Public site', current: false },
  { n: 3, name: 'Backend & admin core', current: false },
  { n: 4, name: 'Funnel instrumentation', current: false },
  { n: 5, name: 'Content, copy & proof', current: false },
  { n: 6, name: 'Hardening & launch', current: false },
] as const;

function Dot({ ok }: { ok: boolean }) {
  return <span aria-hidden className={`size-2 rounded-full ${ok ? 'bg-brand' : 'bg-danger'}`} />;
}

function StatusRow({
  label,
  status,
  latencyMs,
  indent = false,
}: {
  label: string;
  status: string;
  latencyMs?: number | undefined;
  indent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={`text-ink-2 ${indent ? 'pl-4' : ''}`}>{label}</dt>
      <dd className="tabular text-ink flex items-center gap-2 font-medium">
        <Dot ok={status === 'ok' || status === 'running'} />
        {status}
        {latencyMs !== undefined && <span className="text-ink-2">{latencyMs}ms</span>}
      </dd>
    </div>
  );
}

function ServiceStatus({ health }: { health: HealthResponse | null }) {
  return (
    <section className="border-line bg-surface shadow-card-sm mt-10 rounded-[--radius-md] border p-6">
      <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Services</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <StatusRow label="Web" status="running" />
        <StatusRow label="API" status={health ? health.status : 'unreachable'} />
        {health?.checks.map((check: HealthCheck) => (
          <StatusRow
            key={check.name}
            label={check.name}
            status={check.status}
            latencyMs={check.latencyMs}
            indent
          />
        ))}
      </dl>
    </section>
  );
}

function Roadmap() {
  return (
    <section className="border-line bg-bg-alt mt-8 rounded-[--radius-md] border p-6">
      <h2 className="text-ink text-sm font-semibold tracking-wide uppercase">Roadmap</h2>
      <ol className="mt-4 space-y-2">
        {PHASES.map((phase) => (
          <li key={phase.n} className="flex items-center gap-3 text-sm">
            <span
              className={`tabular inline-flex size-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                phase.current ? 'bg-brand text-on-brand' : 'bg-surface text-ink-2 ring-line ring-1'
              }`}
            >
              {phase.n}
            </span>
            <span className={phase.current ? 'text-ink font-semibold' : 'text-ink-2'}>
              {phase.name}
            </span>
            {phase.current && (
              <span className="text-brand ml-auto text-xs font-medium">in progress</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function Home() {
  const health = await getApiHealth();

  return (
    <main id="main" className="bg-bg min-h-dvh">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-brand text-xs font-semibold tracking-[0.18em] uppercase">Foundation</p>

        <h1 className="text-heading mt-4 text-4xl leading-[1.08] font-extrabold tracking-[-0.045em] sm:text-6xl">
          Beekal
        </h1>

        <p className="text-ink-2 mt-4 max-w-xl text-lg leading-relaxed">
          Better systems. Better work. Better tomorrow.
        </p>

        <ServiceStatus health={health} />
        <Roadmap />

        <p className="text-ink-2 mt-8 text-sm">
          The plan lives in <code className="text-ink font-medium">docs/</code>. The original
          single-file demo is preserved at{' '}
          <code className="text-ink font-medium">legacy/beekal-website-demo.html</code>.
        </p>
      </div>
    </main>
  );
}
