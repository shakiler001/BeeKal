'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SetPasswordSchema } from '@beekal/contracts/auth';
import { Button, Card, Field, Input } from '@/components/ui';

export function SetupForm({ token }: { token: string }) {
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const parsed = SetPasswordSchema.safeParse({
      token,
      password: data.get('password'),
      confirm: data.get('confirm'),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not activate your account');
        return;
      }
      setDone(true);
    } catch {
      setError('Could not reach the server. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="lg">
      {done ? (
        <div className="space-y-4 text-center">
          <p>Your account is ready.</p>
          <Link href="/admin/login" className="text-brand font-semibold underline">
            Sign in
          </Link>
        </div>
      ) : token.length < 16 ? (
        <p role="alert">This invitation link is incomplete. Ask an administrator for a new one.</p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="grid gap-4">
          <Field label="Password" htmlFor="setup-password">
            <Input
              id="setup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </Field>
          <Field label="Confirm password" htmlFor="setup-confirm">
            <Input
              id="setup-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </Field>
          <p className="text-ink-2 text-sm">
            Use at least 12 characters. This link expires after 48 hours and works once.
          </p>
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <Button type="submit" full disabled={submitting}>
            {submitting ? 'Activating…' : 'Set password'}
          </Button>
        </form>
      )}
    </Card>
  );
}
