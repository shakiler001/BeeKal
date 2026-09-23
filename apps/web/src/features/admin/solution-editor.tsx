'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SolutionUpsertSchema } from '@beekal/contracts';
import { Button, Card, Field, Input, Textarea } from '@/components/ui';

/**
 * The category editor.
 *
 * A category is what the homepage row, the /solutions pages and the footer are
 * built from, and what every case study is filed under. Until now there were
 * five of them compiled into the repository; this is what makes them the
 * founder's to add.
 *
 * `key` is immutable after creation. Case studies and problem pages reference
 * it, and renaming it would silently orphan them — the API offers no update
 * path for it, and the field is disabled here rather than merely ignored, so
 * the rule is visible instead of surprising.
 *
 * The four lists are edited as one line per item. A repeater with add and
 * remove buttons for four separate lists would be a lot of chrome for
 * something a person is going to paste from a document anyway.
 */

export interface SolutionFormValues {
  id?: string;
  key: string;
  slug: string;
  name: string;
  cardHeadline: string;
  cardBody: string;
  pageHeadline: string;
  pageIntro: string;
  signs: string[];
  whatWeDo: string[];
  before: string[];
  after: string[];
  seoTitle: string;
  seoDescription: string;
  order: number;
  status?: string;
}

export const EMPTY_SOLUTION: SolutionFormValues = {
  key: '',
  slug: '',
  name: '',
  cardHeadline: '',
  cardBody: '',
  pageHeadline: '',
  pageIntro: '',
  signs: [],
  whatWeDo: [],
  before: [],
  after: [],
  seoTitle: '',
  seoDescription: '',
  order: 0,
};

const LISTS = [
  {
    key: 'signs',
    label: 'Signs you need this',
    hint: 'One per line. The symptoms a reader recognises in their own week.',
  },
  { key: 'whatWeDo', label: 'What we do', hint: 'One per line.' },
  { key: 'before', label: 'Before', hint: 'One per line. How things are without it.' },
  { key: 'after', label: 'After', hint: 'One per line. How things are with it.' },
] as const;

const TEXTS = [
  { key: 'cardHeadline', label: 'Card headline', hint: 'On the homepage and the index.' },
  { key: 'cardBody', label: 'Card body', hint: 'Two sentences at most.' },
  { key: 'pageHeadline', label: 'Page headline', hint: 'The h1 on its own page.' },
  { key: 'pageIntro', label: 'Page intro' },
] as const;

const toLines = (v: string): string[] =>
  v
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export function SolutionEditor({
  initial,
  canPublish,
  canDelete,
}: {
  initial: SolutionFormValues;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<SolutionFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const isNew = !values.id;

  function set<K extends keyof SolutionFormValues>(key: K, value: SolutionFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save(): Promise<void> {
    setBusy(true);
    setFormError('');
    setErrors({});

    const parsed = SolutionUpsertSchema.safeParse({ ...values, order: Number(values.order) || 0 });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
      setErrors(next);
      setFormError('Some fields need attention.');
      setBusy(false);
      return;
    }

    // `key` is immutable, so an update must not try to send one.
    const body: Record<string, unknown> = { ...parsed.data };
    if (!isNew) delete body['key'];

    try {
      const res = await fetch(
        isNew ? '/api/admin/solutions' : `/api/admin/solutions/${values.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const payload = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(payload.message ?? `Save failed (${res.status})`);

      setSaved(true);
      if (isNew && payload.id) router.replace(`/admin/content/solutions/${payload.id}`);
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
      const res = await fetch(`/api/admin/solutions/${values.id}/status`, {
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
      const res = await fetch(`/api/admin/solutions/${values.id}`, { method: 'DELETE' });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      // The API refuses while case studies still reference it, and says how
      // many. That message is the useful part, so it is shown rather than
      // replaced with something generic.
      if (!res.ok) throw new Error(payload.message ?? 'Delete failed');
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
            htmlFor="sol-key"
            error={errors['key']}
            hint={
              isNew
                ? 'Short, lowercase, permanent. Case studies are filed under it.'
                : 'Permanent once set — case studies reference it.'
            }
          >
            <Input
              id="sol-key"
              value={values.key}
              disabled={!isNew}
              onChange={(e) => set('key', e.target.value)}
              placeholder="consultancy"
            />
          </Field>
          <Field label="Address" htmlFor="sol-slug" error={errors['slug']} hint="/solutions/…">
            <Input
              id="sol-slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="consultancy"
            />
          </Field>
          <Field
            label="Name"
            htmlFor="sol-name"
            error={errors['name']}
            className="sm:col-span-2"
            hint="As it appears everywhere on the site."
          >
            <Input
              id="sol-name"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Beekal Consultancy"
            />
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
              htmlFor={`sol-${f.key}`}
              error={errors[f.key]}
              {...('hint' in f ? { hint: f.hint } : {})}
            >
              <Textarea
                id={`sol-${f.key}`}
                rows={f.key === 'pageIntro' ? 4 : 2}
                value={values[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Lists</h2>
        <p className="text-ink-2 mt-1 text-[0.9rem]">One item per line. Blank lines are ignored.</p>
        <div className="mt-4 grid gap-4">
          {LISTS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              htmlFor={`sol-${f.key}`}
              error={errors[f.key]}
              hint={f.hint}
            >
              <Textarea
                id={`sol-${f.key}`}
                rows={4}
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
          <Field label="SEO title" htmlFor="sol-seoTitle" error={errors['seoTitle']}>
            <Input
              id="sol-seoTitle"
              value={values.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
            />
          </Field>
          <Field
            label="SEO description"
            htmlFor="sol-seoDescription"
            error={errors['seoDescription']}
          >
            <Textarea
              id="sol-seoDescription"
              rows={2}
              value={values.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
            />
          </Field>
          <Field label="Order" htmlFor="sol-order" error={errors['order']} hint="Lowest first.">
            <Input
              id="sol-order"
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
            {busy ? 'Saving…' : isNew ? 'Create category' : 'Save changes'}
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
