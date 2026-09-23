import type { ContentStatus } from '@beekal/contracts';
import { Card } from '@/components/ui';
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

interface FaqRow extends ContentRow {
  question: string;
  group: string;
}

export default async function ContentPage() {
  const session = await requireSession();

  const [solutions, cases, faqs] = await Promise.all([
    can(session, 'solution:read')
      ? adminApi.get<SolutionRow[]>('/content/solutions').catch(() => null)
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
        description="Case studies are live on the site: published rows appear within seconds. Solutions and FAQs are stored here but the public pages still read the repository."
      />

      <div className="mt-8 grid gap-6">
        {cases && (
          <section>
            <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
              Case studies
              <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">{cases.length}</span>
            </h2>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {cases.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{c.title}</span>
                      <span className="text-ink-2 block text-[0.88rem]">{c.context}</span>
                    </span>
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
            <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
              Solutions
              <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">{solutions.length}</span>
            </h2>
            <Card padding="sm">
              <ul className="divide-line divide-y">
                {solutions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-ink-2 block truncate text-[0.88rem]">
                        {s.cardHeadline}
                      </span>
                    </span>
                    <StatusPill status={s.status} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {faqs && (
          <section>
            <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
              FAQs
              <span className="text-ink-2 ml-2 text-[0.9rem] font-medium">{faqs.length}</span>
            </h2>
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

        {!solutions && !cases && !faqs && (
          <Card>
            <p className="text-ink-2">Your role does not include any content types.</p>
          </Card>
        )}
      </div>
    </>
  );
}
