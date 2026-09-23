import Link from 'next/link';
import type { ContentStatus } from '@beekal/contracts';
import { Button, Card } from '@/components/ui';
import { adminApi } from '@/lib/admin/api';
import { can, requireSession } from '@/lib/admin/session';
import { AdminPageHeader } from '@/features/admin/page-header';
import { StatusPill } from '@/features/admin/status-pill';

export const metadata = { title: 'Content' };

interface ContentRow {
  id: string;
  status: ContentStatus;
  updatedAt: string;
}

interface SolutionRow extends ContentRow {
  name: string;
  cardHeadline: string;
}

interface CaseStudyRow extends ContentRow {
  title: string;
  context: string;
  isIllustrative: boolean;
  featured: boolean;
}

interface ProblemRow extends ContentRow {
  cardHeadline: string;
  cardAnswer: string;
}

interface FaqRow extends ContentRow {
  question: string;
  group: string;
}

export default async function ContentPage() {
  const session = await requireSession();

  const [solutions, problems, cases, faqs] = await Promise.all([
    can(session, 'solution:read')
      ? adminApi.get<SolutionRow[]>('/content/solutions').catch(() => null)
      : null,
    can(session, 'problem:read')
      ? adminApi.get<ProblemRow[]>('/content/problems').catch(() => null)
      : null,
    can(session, 'case_study:read')
      ? adminApi.get<CaseStudyRow[]>('/content/case-studies').catch(() => null)
      : null,
    can(session, 'faq:read') ? adminApi.get<FaqRow[]>('/content/faqs').catch(() => null) : null,
  ]);

  return (
    <>
      <AdminPageHeader
        title="Content"
        description="Everything here is live on the site. Published changes appear within seconds — no deploy."
      />

      <div className="mt-8 grid gap-6">
        {cases && (
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Case studies
                <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">{cases.length}</span>
              </h2>
              {can(session, 'case_study:create') && (
                <Button asChild size="sm" className="ml-auto">
                  <Link href="/admin/content/case-studies/new">Write one</Link>
                </Button>
              )}
            </div>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {cases.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Link
                      href={`/admin/content/case-studies/${c.id}`}
                      className="min-w-0 flex-1 rounded-sm underline-offset-4 hover:underline"
                    >
                      <span className="font-medium">{c.title}</span>
                      <span className="text-ink-2 block text-[0.88rem]">{c.context}</span>
                    </Link>
                    {c.isIllustrative && (
                      <span className="bg-accent text-on-accent rounded-full px-2 py-0.5 text-[0.7rem] font-bold tracking-wide uppercase">
                        Example
                      </span>
                    )}
                    {c.featured && (
                      <span className="text-ink-2 text-[0.78rem] font-semibold tracking-wide uppercase">
                        Featured
                      </span>
                    )}
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            </Card>
            <p className="text-ink-2 mt-2 text-[0.85rem]">
              A case study can only stop being an example once it has a named client and written
              approval — the database enforces that, not just this screen.
            </p>
          </section>
        )}

        {solutions && (
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Categories
                <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">
                  {solutions.length}
                </span>
              </h2>
              {can(session, 'solution:create') && (
                <Button asChild size="sm" className="ml-auto">
                  <Link href="/admin/content/solutions/new">Add a category</Link>
                </Button>
              )}
            </div>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {solutions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Link
                      href={`/admin/content/solutions/${s.id}`}
                      className="min-w-0 flex-1 rounded-sm underline-offset-4 hover:underline"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-ink-2 block truncate text-[0.88rem]">
                        {s.cardHeadline}
                      </span>
                    </Link>
                    <StatusPill status={s.status} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {faqs && (
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                FAQs
                <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">{faqs.length}</span>
              </h2>
              <Button asChild size="sm" variant="ghost" className="ml-auto">
                <Link href="/admin/content/faqs">Edit them</Link>
              </Button>
            </div>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {faqs.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="min-w-0 flex-1 font-medium">{f.question}</span>
                    <span className="text-ink-2 text-[0.82rem]">{f.group}</span>
                    <StatusPill status={f.status} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {problems && (
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Problem pages
                <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">{problems.length}</span>
              </h2>
              {can(session, 'problem:create') && (
                <Button asChild size="sm" className="ml-auto">
                  <Link href="/admin/content/problems/new">Add one</Link>
                </Button>
              )}
            </div>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {problems.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Link
                      href={`/admin/content/problems/${p.id}`}
                      className="min-w-0 flex-1 rounded-sm underline-offset-4 hover:underline"
                    >
                      <span className="font-medium">{p.cardHeadline}</span>
                      <span className="text-ink-2 block truncate text-[0.88rem]">
                        {p.cardAnswer}
                      </span>
                    </Link>
                    <StatusPill status={p.status} />
                  </li>
                ))}
              </ul>
            </Card>
            <p className="text-ink-2 mt-2 text-[0.85rem]">
              Landing pages for people searching the symptom rather than the service. Deliberately
              not in the main navigation.
            </p>
          </section>
        )}

        {!solutions && !problems && !cases && !faqs && (
          <Card>
            <p className="text-ink-2">Your role does not include any content types.</p>
          </Card>
        )}
      </div>
    </>
  );
}
