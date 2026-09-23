'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaqUpsertSchema } from '@beekal/contracts';
import { Button, Card, Field, Input, Textarea } from '@/components/ui';

/**
 * FAQs, edited in place.
 *
 * Deliberately not the new-page-then-edit-page pattern the other content types
 * use. An FAQ is a question and an answer; sending someone to a separate screen
 * and back to change six words is the sort of thing that makes people stop
 * updating content. They are also read as a set — the value is in the order and
 * in whether the objections are covered — so the whole set is on one screen.
 *
 * These are booking objections rather than general questions, which is why they
 * appear on /assessment and nowhere else.
 */

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  group: string;
  order: number;
}

export function FaqEditor({
  initial,
  canCreate,
  canUpdate,
  canDelete,
}: {
  initial: FaqRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<FaqRow[]>(initial);
  const [draft, setDraft] = useState<{ question: string; answer: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  function edit(id: string, patch: Partial<FaqRow>): void {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function send(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
    const res = await fetch(url, {
      method,
      ...(body
        ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : {}),
    });
    const payload = (await res.json().catch(() => ({}))) as { message?: string; id?: string };
    if (!res.ok) throw new Error(payload.message ?? `Request failed (${res.status})`);
    return payload;
  }

  async function save(row: FaqRow): Promise<void> {
    setBusy(row.id);
    setError('');
    const parsed = FaqUpsertSchema.safeParse(row);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the question and answer.');
      setBusy('');
      return;
    }
    try {
      await send(`/api/admin/faqs/${row.id}`, 'PATCH', parsed.data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy('');
    }
  }

  async function remove(id: string): Promise<void> {
    setBusy(id);
    setError('');
    try {
      await send(`/api/admin/faqs/${id}`, 'DELETE');
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusy('');
    }
  }

  async function create(): Promise<void> {
    if (!draft) return;
    setBusy('new');
    setError('');
    const parsed = FaqUpsertSchema.safeParse({
      ...draft,
      group: 'assessment',
      order: rows.length,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the question and answer.');
      setBusy('');
      return;
    }
    try {
      const created = await send('/api/admin/faqs', 'POST', parsed.data);
      if (created.id) {
        setRows((prev) => [...prev, { id: created.id as string, ...parsed.data }]);
      }
      setDraft(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add it.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <Card key={row.id} padding="lg">
          <div className="grid gap-4">
            <Field label="Question" htmlFor={`faq-q-${row.id}`}>
              <Input
                id={`faq-q-${row.id}`}
                value={row.question}
                disabled={!canUpdate}
                onChange={(e) => edit(row.id, { question: e.target.value })}
              />
            </Field>
            <Field label="Answer" htmlFor={`faq-a-${row.id}`}>
              <Textarea
                id={`faq-a-${row.id}`}
                rows={3}
                value={row.answer}
                disabled={!canUpdate}
                onChange={(e) => edit(row.id, { answer: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              {canUpdate && (
                <Button size="sm" onClick={() => void save(row)} disabled={busy === row.id}>
                  {busy === row.id ? 'Saving…' : 'Save'}
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void remove(row.id)}
                  disabled={busy === row.id}
                >
                  Delete
                </Button>
              )}
              <span className="text-ink-2 ml-auto text-[0.82rem]">{row.group}</span>
            </div>
          </div>
        </Card>
      ))}

      {canCreate &&
        (draft ? (
          <Card padding="lg">
            <div className="grid gap-4">
              <Field label="Question" htmlFor="faq-new-q">
                <Input
                  id="faq-new-q"
                  value={draft.question}
                  onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                />
              </Field>
              <Field label="Answer" htmlFor="faq-new-a">
                <Textarea
                  id="faq-new-a"
                  rows={3}
                  value={draft.answer}
                  onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={() => void create()} disabled={busy === 'new'}>
                  {busy === 'new' ? 'Adding…' : 'Add it'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setDraft({ question: '', answer: '' })}>
              Add a question
            </Button>
          </div>
        ))}

      {error && (
        <p role="alert" className="text-danger text-[0.9rem] font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
