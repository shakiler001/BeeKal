'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArticleUpsertSchema, type Block } from '@beekal/contracts';
import { Button, Card, Field, Input, Textarea } from '@/components/ui';
import { toBlocks, toText } from './blocks';

/**
 * The article editor.
 *
 * Articles are the top of the funnel: the free material someone reads long
 * before they enquire. The whole argument against giving education its own
 * Solution was that it belongs here instead — which only holds if publishing
 * here is genuinely easy.
 *
 * The body is written as text and converted to blocks on save. The convention is
 * explained above the box rather than in documentation nobody opens, and it
 * round-trips, so opening an article to fix a typo does not rewrite it.
 */

export interface ArticleFormValues {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: Block[];
  tags: string[];
  readMinutes: number;
  seoTitle: string;
  seoDescription: string;
  status?: string;
}

export const EMPTY_ARTICLE: ArticleFormValues = {
  slug: '',
  title: '',
  excerpt: '',
  body: [],
  tags: [],
  readMinutes: 4,
  seoTitle: '',
  seoDescription: '',
};

const BODY_HELP = [
  '## a heading',
  '- a list item',
  '> a quote — attribution',
  'anything else is a paragraph; a blank line ends it',
];

export function ArticleEditor({
  initial,
  canPublish,
  canDelete,
}: {
  initial: ArticleFormValues;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ArticleFormValues>(initial);
  // The body is edited as text and only becomes blocks on save, so that what is
  // typed is exactly what comes back.
  const [bodyText, setBodyText] = useState(() => toText(initial.body));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const isNew = !values.id;
  const blocks = toBlocks(bodyText);

  function set<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save(): Promise<void> {
    setBusy(true);
    setFormError('');
    setErrors({});

    const parsed = ArticleUpsertSchema.safeParse({
      ...values,
      body: blocks,
      readMinutes: Number(values.readMinutes) || 1,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
      setErrors(next);
      setFormError('Some fields need attention.');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(isNew ? '/api/admin/articles' : `/api/admin/articles/${values.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(payload.message ?? `Save failed (${res.status})`);

      setSaved(true);
      setValues((prev) => ({ ...prev, body: parsed.data.body }));
      if (isNew && payload.id) router.replace(`/admin/content/articles/${payload.id}`);
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
      const res = await fetch(`/api/admin/articles/${values.id}/status`, {
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
    try {
      const res = await fetch(`/api/admin/articles/${values.id}`, { method: 'DELETE' });
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
        <h2 className="font-display text-lg font-bold">The article</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Address" htmlFor="art-slug" error={errors['slug']} hint="/insights/…">
            <Input
              id="art-slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
            />
          </Field>
          <Field
            label="Reading time"
            htmlFor="art-read"
            error={errors['readMinutes']}
            hint="Minutes. Shown on the index."
          >
            <Input
              id="art-read"
              type="number"
              min={1}
              max={60}
              value={values.readMinutes}
              onChange={(e) => set('readMinutes', Number(e.target.value))}
            />
          </Field>
          <Field
            label="Title"
            htmlFor="art-title"
            error={errors['title']}
            className="sm:col-span-2"
          >
            <Input
              id="art-title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field
            label="Excerpt"
            htmlFor="art-excerpt"
            error={errors['excerpt']}
            className="sm:col-span-2"
            hint="What appears on the index. Two sentences."
          >
            <Textarea
              id="art-excerpt"
              rows={2}
              value={values.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </Field>
          <Field
            label="Tags"
            htmlFor="art-tags"
            error={errors['tags']}
            className="sm:col-span-2"
            hint="Comma separated."
          >
            <Input
              id="art-tags"
              value={values.tags.join(', ')}
              onChange={(e) =>
                set(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Body</h2>
        <ul className="text-ink-2 mt-2 grid gap-0.5 text-[0.85rem]">
          {BODY_HELP.map((line) => (
            <li key={line}>
              <code>{line}</code>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <Field label="Text" htmlFor="art-body" error={errors['body']}>
            <Textarea
              id="art-body"
              rows={18}
              value={bodyText}
              onChange={(e) => {
                setBodyText(e.target.value);
                setSaved(false);
              }}
            />
          </Field>
          <p className="text-ink-2 mt-2 text-[0.85rem]">
            {blocks.length} block{blocks.length === 1 ? '' : 's'}:{' '}
            {blocks.length === 0 ? 'nothing yet' : summarise(blocks)}
          </p>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Search</h2>
        <div className="mt-4 grid gap-4">
          <Field label="SEO title" htmlFor="art-seoTitle" error={errors['seoTitle']}>
            <Input
              id="art-seoTitle"
              value={values.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
            />
          </Field>
          <Field
            label="SEO description"
            htmlFor="art-seoDescription"
            error={errors['seoDescription']}
          >
            <Textarea
              id="art-seoDescription"
              rows={2}
              value={values.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
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

/** A plain count of what the text parsed into, so mistakes are visible early. */
function summarise(blocks: Block[]): string {
  const counts = new Map<string, number>();
  for (const b of blocks) counts.set(b.type, (counts.get(b.type) ?? 0) + 1);
  const names: Record<string, string> = {
    p: 'paragraph',
    h2: 'heading',
    list: 'list',
    quote: 'quote',
  };
  return [...counts]
    .map(([type, n]) => `${n} ${names[type] ?? type}${n === 1 ? '' : 's'}`)
    .join(', ');
}
