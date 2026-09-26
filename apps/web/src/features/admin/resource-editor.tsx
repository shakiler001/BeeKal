'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ResourceUpsertSchema } from '@beekal/contracts';
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui';

/**
 * The resource editor.
 *
 * A resource is the thing exchanged for an email address — the checklist or
 * guide that makes someone willing to be contacted later.
 *
 * Two fields decide whether it works at all, so both say what they mean here.
 * `fileUrl` is where the file actually lives; without it the resources page
 * prevents publishing the resource. `isGated` decides whether an email is asked for, and defaults to
 * asking — the other default would quietly give away the thing the exchange is
 * built on.
 */

export interface ResourceFormValues {
  id?: string;
  slug: string;
  title: string;
  description: string;
  kind: 'checklist' | 'guide' | 'tool';
  contents: string[];
  fileUrl: string;
  isGated: boolean;
  seoTitle: string;
  seoDescription: string;
  order: number;
  status?: string;
}

export const EMPTY_RESOURCE: ResourceFormValues = {
  slug: '',
  title: '',
  description: '',
  kind: 'checklist',
  contents: [],
  fileUrl: '',
  isGated: true,
  seoTitle: '',
  seoDescription: '',
  order: 0,
};

const KINDS: Array<{ value: ResourceFormValues['kind']; label: string }> = [
  { value: 'checklist', label: 'Checklist' },
  { value: 'guide', label: 'Guide' },
  { value: 'tool', label: 'Tool' },
];

const toLines = (v: string): string[] =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function ResourceEditor({
  initial,
  canPublish,
  canDelete,
}: {
  initial: ResourceFormValues;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ResourceFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const isNew = !values.id;

  function set<K extends keyof ResourceFormValues>(key: K, value: ResourceFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save(): Promise<void> {
    setBusy(true);
    setFormError('');
    setErrors({});

    const parsed = ResourceUpsertSchema.safeParse({
      ...values,
      fileUrl: values.fileUrl.trim() === '' ? null : values.fileUrl.trim(),
      order: Number(values.order) || 0,
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
      const res = await fetch(
        isNew ? '/api/admin/resources' : `/api/admin/resources/${values.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        },
      );
      const payload = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(payload.message ?? `Save failed (${res.status})`);

      setSaved(true);
      if (isNew && payload.id) router.replace(`/admin/content/resources/${payload.id}`);
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
      const res = await fetch(`/api/admin/resources/${values.id}/status`, {
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
      const res = await fetch(`/api/admin/resources/${values.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/content');
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Delete failed.');
      setBusy(false);
    }
  }

  const noFile = values.fileUrl.trim() === '';

  return (
    <div className="grid gap-6">
      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">The resource</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Address" htmlFor="res-slug" error={errors['slug']} hint="/resources/…">
            <Input
              id="res-slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
            />
          </Field>
          <Field label="Kind" htmlFor="res-kind" error={errors['kind']}>
            <Select
              id="res-kind"
              value={values.kind}
              onChange={(e) => set('kind', e.target.value as ResourceFormValues['kind'])}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Title"
            htmlFor="res-title"
            error={errors['title']}
            className="sm:col-span-2"
          >
            <Input
              id="res-title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="res-description"
            error={errors['description']}
            className="sm:col-span-2"
          >
            <Textarea
              id="res-description"
              rows={2}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <Field
            label="What is in it"
            htmlFor="res-contents"
            error={errors['contents']}
            className="sm:col-span-2"
            hint="One per line."
          >
            <Textarea
              id="res-contents"
              rows={5}
              value={values.contents.join('\n')}
              onChange={(e) => set('contents', toLines(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">The file</h2>
        <div className="mt-4 grid gap-4">
          <Field
            label="File or link"
            htmlFor="res-fileUrl"
            error={errors['fileUrl']}
            optional
            hint="Where the file actually lives, or a link for a tool."
          >
            <Input
              id="res-fileUrl"
              value={values.fileUrl}
              onChange={(e) => set('fileUrl', e.target.value)}
              placeholder="/files/system-audit-checklist.pdf"
            />
          </Field>

          {noFile && (
            <p className="text-ink-2 text-[0.9rem]">
              This resource needs a file or tool link before it can be published.
            </p>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={values.isGated}
              onChange={(e) => set('isGated', e.target.checked)}
            />
            <span>
              <span className="font-semibold">Ask for an email address first</span>
              <span className="text-ink-2 block text-[0.9rem]">
                Untick to give it away freely. The email is a contact consent, never a mailing list
                subscription.
              </span>
            </span>
          </label>

          <Field label="Order" htmlFor="res-order" error={errors['order']} hint="Lowest first.">
            <Input
              id="res-order"
              type="number"
              min={0}
              value={values.order}
              onChange={(e) => set('order', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="font-display text-lg font-bold">Search</h2>
        <div className="mt-4 grid gap-4">
          <Field label="SEO title" htmlFor="res-seoTitle" error={errors['seoTitle']}>
            <Input
              id="res-seoTitle"
              value={values.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
            />
          </Field>
          <Field
            label="SEO description"
            htmlFor="res-seoDescription"
            error={errors['seoDescription']}
          >
            <Textarea
              id="res-seoDescription"
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
