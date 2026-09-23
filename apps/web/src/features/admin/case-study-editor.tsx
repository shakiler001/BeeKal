'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CaseStudyUpsertSchema } from '@beekal/contracts';
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui';

/**
 * The case study editor.
 *
 * The form follows the eight-part format the site renders, in the order it
 * renders it, so writing one feels like writing the page rather than filling in
 * a database row.
 *
 * Two things it does that a generic CRUD form would not:
 *
 * **It explains the honesty rule before Postgres enforces it.** A case study
 * may only claim to be real with a named client and recorded approval. That is
 * a CHECK constraint, an API guard and a client-side refinement; here it is
 * also a sentence, because being told "violates constraint
 * case_study_real_requires_approval" is not the same as being told why.
 *
 * **It validates with the same schema the API uses.** Not to save a round trip
 * — the API validates regardless — but so the message about a field appears
 * next to that field instead of as one error at the top.
 */

export interface CaseStudyFormValues {
  id?: string;
  slug: string;
  title: string;
  clientName: string;
  context: string;
  solutionKey: string;
  tabLabel: string;
  problem: string;
  beforeLead: string;
  before: string;
  diagnosis: string;
  whatChanged: string;
  howBuilt: string;
  results: Array<{ value: string; label: string }>;
  lesson: string;
  isIllustrative: boolean;
  clientApproved: boolean;
  featured: boolean;
  order: number;
  status?: string;
}

export const EMPTY_CASE_STUDY: CaseStudyFormValues = {
  slug: '',
  title: '',
  clientName: '',
  context: '',
  solutionKey: 'build',
  tabLabel: '',
  problem: '',
  beforeLead: '',
  before: '',
  diagnosis: '',
  whatChanged: '',
  howBuilt: '',
  results: [{ value: '', label: '' }],
  lesson: '',
  isIllustrative: true,
  clientApproved: false,
  featured: false,
  order: 0,
};

const LONG_FIELDS = [
  { key: 'problem', label: 'The problem', hint: 'What the business could not do.' },
  { key: 'beforeLead', label: 'Before, in one line', hint: 'The state of things on day one.' },
  { key: 'before', label: 'Before, in full', hint: 'How the work actually happened.' },
  { key: 'diagnosis', label: 'Diagnosis', hint: 'What was really causing it.' },
  { key: 'whatChanged', label: 'What changed', hint: 'The change from the buyer’s side.' },
  { key: 'howBuilt', label: 'How it was built', hint: 'Enough for a technical reader.' },
  {
    key: 'lesson',
    label: 'What we would do differently',
    hint: 'Mandatory. The most credible thing on the page, precisely because nobody fakes one.',
  },
] as const;

export function CaseStudyEditor({
  initial,
  solutions,
  canPublish,
  canDelete,
}: {
  initial: CaseStudyFormValues;
  solutions: Array<{ key: string; name: string }>;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CaseStudyFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const isNew = !values.id;

  function set<K extends keyof CaseStudyFormValues>(key: K, value: CaseStudyFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function payload(): unknown {
    return {
      ...values,
      // The schema wants null, not "", for an absent client.
      clientName: values.clientName.trim() === '' ? null : values.clientName.trim(),
      results: values.results.filter((r) => r.value.trim() !== '' || r.label.trim() !== ''),
      order: Number(values.order) || 0,
    };
  }

  async function save(): Promise<void> {
    setBusy(true);
    setFormError('');
    setErrors({});

    const parsed = CaseStudyUpsertSchema.safeParse(payload());
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        next[path] ??= issue.message;
      }
      setErrors(next);
      setFormError('Some fields need attention.');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(
        isNew ? '/api/admin/case-studies' : `/api/admin/case-studies/${values.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        },
      );
      const body = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(body.message ?? `Save failed (${res.status})`);

      setSaved(true);
      if (isNew && body.id) router.replace(`/admin/content/case-studies/${body.id}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  /**
   * The API takes the status to move to, not a verb. Unpublishing returns a row
   * to DRAFT rather than archiving it — archived content has to come back
   * through draft anyway, so draft is the reversible choice.
   */
  async function changeStatus(next: 'PUBLISHED' | 'DRAFT'): Promise<void> {
    const verb = next === 'PUBLISHED' ? 'publish' : 'unpublish';
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch(`/api/admin/case-studies/${values.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json()) as { status?: string; message?: string };
      if (!res.ok) throw new Error(body.message ?? `Could not ${verb} this`);
      // Hoisted to a local so the narrowing survives into the closure, and
      // assigned only when present: `exactOptionalPropertyTypes` treats an
      // explicit undefined as different from an absent key.
      const nextStatus = body.status;
      if (nextStatus) setValues((prev) => ({ ...prev, status: nextStatus }));
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : `Could not ${verb} this.`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/case-studies/${values.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/content');
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Delete failed.');
      setBusy(false);
    }
  }

  const claimBlocked = !values.isIllustrative && !(values.clientApproved && values.clientName);

  return (
    <div className="grid gap-6">
      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Slug" htmlFor="cs-slug" error={errors['slug']} hint="Used in the URL.">
            <Input
              id="cs-slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="garment-exporter-order-visibility"
            />
          </Field>
          <Field label="Category" htmlFor="cs-solution" error={errors['solutionKey']}>
            <Select
              id="cs-solution"
              value={values.solutionKey}
              onChange={(e) => set('solutionKey', e.target.value)}
            >
              {solutions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Title"
            htmlFor="cs-title"
            error={errors['title']}
            className="sm:col-span-2"
            hint="The outcome, in the buyer’s words."
          >
            <Input
              id="cs-title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field
            label="Context"
            htmlFor="cs-context"
            error={errors['context']}
            hint="Sector, size, location."
          >
            <Input
              id="cs-context"
              value={values.context}
              onChange={(e) => set('context', e.target.value)}
              placeholder="Garment exporter · Dhaka · 180 staff"
            />
          </Field>
          <Field label="Short label" htmlFor="cs-tab" error={errors['tabLabel']}>
            <Input
              id="cs-tab"
              value={values.tabLabel}
              onChange={(e) => set('tabLabel', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">The eight-part format</h2>
        <div className="mt-4 grid gap-4">
          {LONG_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              htmlFor={`cs-${f.key}`}
              error={errors[f.key]}
              hint={f.hint}
            >
              <Textarea
                id={`cs-${f.key}`}
                rows={f.key === 'beforeLead' ? 2 : 4}
                value={values[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Card>

      <ResultsEditor
        results={values.results}
        error={errors['results']}
        onChange={(results) => set('results', results)}
      />

      <ClaimEditor values={values} errors={errors} blocked={claimBlocked} onChange={set} />

      <Card padding="lg">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
          </Button>

          {!isNew && canPublish && (
            <Button
              variant="ghost"
              onClick={() =>
                void changeStatus(values.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
              }
              disabled={busy || claimBlocked}
            >
              {values.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </Button>
          )}

          {!isNew && canDelete && (
            <Button variant="ghost" onClick={() => void remove()} disabled={busy}>
              Delete
            </Button>
          )}

          {saved && <span className="text-ink-2 text-[0.9rem]">Saved.</span>}
          {values.status && (
            <span className="text-ink-2 ml-auto text-[0.85rem]">Status: {values.status}</span>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-danger mt-3 text-[0.9rem] font-medium">
            {formError}
          </p>
        )}
      </Card>
    </div>
  );
}

/** Results are a repeater: a number and what the number means. */
function ResultsEditor({
  results,
  error,
  onChange,
}: {
  results: Array<{ value: string; label: string }>;
  error?: string | undefined;
  onChange: (next: Array<{ value: string; label: string }>) => void;
}) {
  return (
    <Card padding="lg">
      <h2 className="font-display text-lg font-bold">Results</h2>
      <p className="text-ink-2 mt-1 text-[0.9rem]">
        A measured change and what it means. At least one is required — a case study with no result
        is a description.
      </p>

      <div className="mt-4 grid gap-3">
        {results.map((r, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <Field label="Figure" htmlFor={`cs-result-value-${i}`}>
              <Input
                id={`cs-result-value-${i}`}
                value={r.value}
                placeholder="~2 hours"
                onChange={(e) =>
                  onChange(results.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                }
              />
            </Field>
            <Field label="What it means" htmlFor={`cs-result-label-${i}`}>
              <Input
                id={`cs-result-label-${i}`}
                value={r.label}
                placeholder="of each merchandiser’s morning returned to merchandising"
                onChange={(e) =>
                  onChange(results.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
            </Field>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={results.length === 1}
                onClick={() => onChange(results.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3"
        onClick={() => onChange([...results, { value: '', label: '' }])}
      >
        Add another result
      </Button>

      {error && (
        <p role="alert" className="text-danger mt-3 text-[0.9rem] font-medium">
          {error}
        </p>
      )}
    </Card>
  );
}

/**
 * The claim. This is the part of the form that matters most.
 *
 * Everything else here is copy. This decides whether the site tells a visitor
 * that a thing really happened.
 */
function ClaimEditor({
  values,
  errors,
  blocked,
  onChange,
}: {
  values: CaseStudyFormValues;
  errors: Record<string, string>;
  blocked: boolean;
  onChange: <K extends keyof CaseStudyFormValues>(key: K, value: CaseStudyFormValues[K]) => void;
}) {
  return (
    <Card padding="lg">
      <h2 className="font-display text-lg font-bold">What this claims</h2>
      <p className="text-ink-2 mt-1 text-[0.9rem] leading-relaxed">
        An example scenario shows the format on a problem we take on. A real case study says this
        happened to a named client — and may only say so with their written approval. The database
        enforces this; it is written here so the rule is visible before it is hit.
      </p>

      <div className="mt-4 grid gap-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={values.isIllustrative}
            onChange={(e) => onChange('isIllustrative', e.target.checked)}
          />
          <span>
            <span className="font-semibold">This is an example scenario</span>
            <span className="text-ink-2 block text-[0.9rem]">
              Renders the badge, and the page is excluded from search engines.
            </span>
          </span>
        </label>

        {!values.isIllustrative && (
          <div className="border-line grid gap-4 border-l-2 pl-4">
            <Field label="Client name" htmlFor="cs-client" error={errors['clientName']}>
              <Input
                id="cs-client"
                value={values.clientName}
                onChange={(e) => onChange('clientName', e.target.value)}
              />
            </Field>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={values.clientApproved}
                onChange={(e) => onChange('clientApproved', e.target.checked)}
              />
              <span>
                <span className="font-semibold">The client has approved this in writing</span>
                <span className="text-ink-2 block text-[0.9rem]">
                  Tick this only if that is true. It is recorded with a timestamp.
                </span>
              </span>
            </label>

            {blocked && (
              <p role="alert" className="text-danger text-[0.9rem] font-medium">
                A real case study needs a named client and recorded approval. Until then, leave it
                marked as an example scenario.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="size-4"
              checked={values.featured}
              onChange={(e) => onChange('featured', e.target.checked)}
            />
            <span className="font-semibold">Show on the homepage</span>
          </label>

          <Field label="Order" htmlFor="cs-order" error={errors['order']}>
            <Input
              id="cs-order"
              type="number"
              min={0}
              value={values.order}
              onChange={(e) => onChange('order', Number(e.target.value))}
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}
