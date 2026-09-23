'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProblemUpsertSchema } from '@beekal/contracts';
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui';

/**
 * The problem page editor.
 *
 * Problem pages are the landing pages cold traffic arrives on: someone searches
 * the symptom they have, not the service they need. Each one names the category
 * it usually leads to, which is the only link between "my month-end takes three
 * days" and anything Beekal sells.
 *
 * `key` is immutable for the same reason it is on a category — it is what other
 * records point at.
 */

export interface ProblemFormValues {
  id?: string;
  key: string;
  slug: string;
  cardHeadline: string;
  cardAnswer: string;
  cardBody: string;
  pageHeadline: string;
  pageIntro: string;
  diagnostic: string[];
  causes: string;
  fixLooksLike: string[];
  solutionKey: string;
  seoTitle: string;
  seoDescription: string;
  order: number;
  status?: string;
}

export const EMPTY_PROBLEM: ProblemFormValues = {
  key: '',
  slug: '',
  cardHeadline: '',
  cardAnswer: '',
  cardBody: '',
  pageHeadline: '',
  pageIntro: '',
  diagnostic: [],
  causes: '',
  fixLooksLike: [],
  solutionKey: '',
  seoTitle: '',
  seoDescription: '',
  order: 0,
};

const TEXTS = [
  { key: 'cardHeadline', label: 'Card question', hint: 'The symptom, as the reader would say it.' },
  { key: 'cardAnswer', label: 'Card answer', hint: 'Two or three words. "Automate it."' },
  { key: 'cardBody', label: 'Card body' },
  { key: 'pageHeadline', label: 'Page headline' },
  { key: 'pageIntro', label: 'Page intro' },
  { key: 'causes', label: 'What actually causes it' },
] as const;

const LISTS = [
  {
    key: 'diagnostic',
    label: 'Diagnostic',
    hint: 'One per line. "If three of these five are true…"',
  },
  { key: 'fixLooksLike', label: 'What the fix looks like', hint: 'One per line.' },
] as const;

const toLines = (v: string): string[] =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function ProblemEditor({
  initial,
  solutions,
  canPublish,
  canDelete,
}: {
  initial: ProblemFormValues;
  solutions: Array<{ key: string; name: string }>;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProblemFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const isNew = !values.id;

  function set<K extends keyof ProblemFormValues>(key: K, value: ProblemFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save(): Promise<void> {
    setBusy(true);
    setFormError('');
    setErrors({});

    const parsed = ProblemUpsertSchema.safeParse({ ...values, order: Number(values.order) || 0 });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
      setErrors(next);
      setFormError('Some fields need attention.');
      setBusy(false);
      return;
    }

    const body: Record<string, unknown> = { ...parsed.data };
    if (!isNew) delete body['key'];

    try {
      const res = await fetch(isNew ? '/api/admin/problems' : `/api/admin/problems/${values.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(payload.message ?? `Save failed (${res.status})`);

      setSaved(true);
      if (isNew && payload.id) router.replace(`/admin/content/problems/${payload.id}`);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(next: 'PUBLISHED' | 'DRAFT'): Promise<void> {
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch(`/api/admin/problems/${values.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const payload = (await res.json()) as { status?: string; message?: string };
      if (!res.ok) throw new Error(payload.message ?? 'Could not change the status');
      const nextStatus = payload.status;
      if (nextStatus) setValues((prev) => ({ ...prev, status: nextStatus }));
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not change the status.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch(`/api/admin/problems/${values.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/content');
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Delete failed.');
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Key"
            htmlFor="prob-key"
            error={errors['key']}
            hint={isNew ? 'Short, lowercase, permanent.' : 'Permanent once set.'}
          >
            <Input
              id="prob-key"
              value={values.key}
              disabled={!isNew}
              onChange={(e) => set('key', e.target.value)}
              placeholder="manual-work"
            />
          </Field>
          <Field label="Address" htmlFor="prob-slug" error={errors['slug']} hint="/problems/…">
            <Input
              id="prob-slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
            />
          </Field>
          <Field
            label="Leads to which category"
            htmlFor="prob-solution"
            error={errors['solutionKey']}
            className="sm:col-span-2"
            hint="The only link between this symptom and something you sell."
          >
            <Select
              id="prob-solution"
              value={values.solutionKey}
              onChange={(e) => set('solutionKey', e.target.value)}
            >
              <option value="">Choose a category…</option>
              {solutions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Copy</h2>
        <div className="mt-4 grid gap-4">
          {TEXTS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              htmlFor={`prob-${f.key}`}
              error={errors[f.key]}
              {...('hint' in f ? { hint: f.hint } : {})}
            >
              <Textarea
                id={`prob-${f.key}`}
                rows={f.key === 'pageIntro' || f.key === 'causes' ? 4 : 2}
                value={values[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Lists</h2>
        <p className="text-ink-2 mt-1 text-[0.9rem]">One item per line.</p>
        <div className="mt-4 grid gap-4">
          {LISTS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              htmlFor={`prob-${f.key}`}
              error={errors[f.key]}
              hint={f.hint}
            >
              <Textarea
                id={`prob-${f.key}`}
                rows={5}
                value={values[f.key].join('\n')}
                onChange={(e) => set(f.key, toLines(e.target.value))}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Search</h2>
        <div className="mt-4 grid gap-4">
          <Field label="SEO title" htmlFor="prob-seoTitle" error={errors['seoTitle']}>
            <Input
              id="prob-seoTitle"
              value={values.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
            />
          </Field>
          <Field
            label="SEO description"
            htmlFor="prob-seoDescription"
            error={errors['seoDescription']}
          >
            <Textarea
              id="prob-seoDescription"
              rows={2}
              value={values.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
            />
          </Field>
          <Field label="Order" htmlFor="prob-order" error={errors['order']}>
            <Input
              id="prob-order"
              type="number"
              min={0}
              value={values.order}
              onChange={(e) => set('order', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

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
              disabled={busy}
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
