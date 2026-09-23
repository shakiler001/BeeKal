'use client';

import { useState } from 'react';
import { ScoreReportRequestSchema } from '@beekal/contracts/score';
import { Button, Card, Consent, Field, Input } from '@/components/ui';

/**
 * The email ask — shown only AFTER the result is already on screen.
 *
 * Give the value first, then ask. The page promises "no email required to see
 * the result" and that promise is kept: this is a trade for a PDF that is
 * genuinely more than what was already shown (docs/00 section 6), not a gate.
 *
 * The marketing checkbox is separate and unticked. Asking for the report is
 * not permission to start a sequence.
 */
export function ScoreReportOptIn({ shareCode }: { shareCode: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldError('');

    const fd = new FormData(event.currentTarget);
    const email = fd.get('email');

    const parsed = ScoreReportRequestSchema.safeParse({
      shareCode,
      email: typeof email === 'string' ? email : '',
      marketingConsent: fd.get('marketingConsent') === 'on',
    });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Check your email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/score/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        setError('We could not send that. Try again in a moment.');
        return;
      }
      setSent(true);
    } catch {
      setError('We could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card tone="alt" elevation="none">
        <p className="font-display font-semibold">On its way.</p>
        <p className="text-ink-2 mt-2 text-[0.95rem] leading-relaxed">
          The full report — your chart, a page on each weak dimension, and the questions to ask your
          own team — is in your inbox shortly.
        </p>
      </Card>
    );
  }

  return (
    <Card tone="alt" elevation="none">
      <h3 className="font-display font-bold">Want the full report?</h3>
      <p className="text-ink-2 mt-2 text-[0.95rem] leading-relaxed">
        Your chart, a page on each weak dimension, and the questions to ask your own team. Free, and
        more than what is on this screen.
      </p>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        noValidate
        className="mt-4 grid gap-3"
      >
        <Field label="Where should we send it?" htmlFor="score-email" error={fieldError}>
          <Input
            id="score-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={!!fieldError}
          />
        </Field>

        <Consent id="score-marketing" name="marketingConsent">
          Also send me occasional articles about business systems. Unsubscribe any time.
        </Consent>

        <Button type="submit" full disabled={submitting}>
          {submitting ? 'Sending…' : 'Email me the report'}
        </Button>

        {error && (
          <p role="alert" className="text-danger text-[0.9rem] font-medium">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
