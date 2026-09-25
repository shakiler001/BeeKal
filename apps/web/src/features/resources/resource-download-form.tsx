'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Input } from '@/components/ui';

export function ResourceDownloadForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/api/resources/${encodeURIComponent(slug)}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = (await res.json()) as { fileUrl?: string; message?: string };
      if (!res.ok || !result.fileUrl) throw new Error(result.message ?? 'Please try again.');
      setFileUrl(result.fileUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg">
      {fileUrl ? (
        <div role="status">
          <p className="font-semibold">Your resource is ready.</p>
          <a href={fileUrl} className="text-brand mt-3 inline-block font-semibold underline">
            Open or download the resource &rarr;
          </a>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="grid gap-4">
          <Field label="Your email address" htmlFor="resource-email" error={error}>
            <Input
              id="resource-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <p className="text-ink-2 text-sm">
            We record your address to provide this resource. This does not add you to a mailing
            list.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? 'Preparing…' : 'Get the resource'}
          </Button>
        </form>
      )}
    </div>
  );
}
