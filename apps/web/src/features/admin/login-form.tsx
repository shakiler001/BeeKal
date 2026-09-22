'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginSchema } from '@beekal/contracts';
import { Button, Card, Field, Input } from '@/components/ui';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const fd = new FormData(event.currentTarget);
    const email = fd.get('email');
    const password = fd.get('password');

    const parsed = LoginSchema.safeParse({
      email: typeof email === 'string' ? email : '',
      password: typeof password === 'string' ? password : '',
    });

    if (!parsed.success) {
      const next: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email' && !next.email) next.email = issue.message;
        if (key === 'password' && !next.password) next.password = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Sign in failed');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Could not reach the server. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="lg">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        noValidate
      >
        <div className="grid gap-4">
          <Field label="Email" htmlFor="login-email" error={fieldErrors.email}>
            <Input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoFocus
              aria-invalid={!!fieldErrors.email}
            />
          </Field>

          <Field label="Password" htmlFor="login-password" error={fieldErrors.password}>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!fieldErrors.password}
            />
          </Field>

          <Button type="submit" full disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-danger mt-4 text-center text-[0.92rem] font-medium">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
