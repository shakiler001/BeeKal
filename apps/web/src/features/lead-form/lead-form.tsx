'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LeadCreateSchema,
  PROBLEM_AREA_LABELS,
  type LeadCreate,
  type ProblemArea,
} from '@beekal/contracts';
import { Button, Card, Consent, Field, Input, Select, Textarea } from '@/components/ui';
import { SITE } from '@/content/site';
import { cn } from '@/lib/cn';

/**
 * The lead form is a qualification instrument, not a contact form.
 *
 * `problemArea` is the qualifying field: it routes the lead, feeds the score
 * and personalises the founder's reply (docs/01 section 5).
 *
 * Validation uses the SAME Zod schema the API validates with, imported from
 * @beekal/contracts. A field the form sends that the API would reject is a
 * compile error here, not a production bug.
 */

type Errors = Partial<Record<keyof LeadCreate, string>>;

/**
 * FormData.get() can return a File. Stringifying one yields "[object File]",
 * which would silently become a lead's name. Narrow to string, or nothing.
 */
function text(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === 'string' ? value : '';
}

export function LeadForm() {
  const searchParams = useSearchParams();
  const intentParam = searchParams.get('intent');
  const initialIntent = intentParam === 'talk' ? 'talk' : 'assessment';

  const [intent, setIntent] = useState<'assessment' | 'talk'>(initialIntent);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ firstName: string; email: string } | null>(null);
  const [formError, setFormError] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  // Timing check: a human takes more than a couple of seconds to fill this in.
  const renderedAt = useRef(Date.now());

  useEffect(() => {
    if (sent) doneRef.current?.focus();
  }, [sent]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    const fd = new FormData(e.currentTarget);
    const raw = {
      name: text(fd, 'name'),
      email: text(fd, 'email'),
      company: text(fd, 'company') || undefined,
      intent,
      problemArea: text(fd, 'problemArea') as ProblemArea,
      message: text(fd, 'message'),
      contactConsent: fd.get('contactConsent') === 'on',
      marketingConsent: fd.get('marketingConsent') === 'on',
      website: text(fd, 'website'),
      renderedAt: renderedAt.current,
      // Attribution, so the lead's origin survives into the CRM record.
      utmSource: searchParams.get('utm_source') ?? undefined,
      utmMedium: searchParams.get('utm_medium') ?? undefined,
      utmCampaign: searchParams.get('utm_campaign') ?? undefined,
      utmContent: searchParams.get('utm_content') ?? undefined,
      utmTerm: searchParams.get('utm_term') ?? undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      landingPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    const parsed = LeadCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeadCreate;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);

      // Move focus to the first field with a problem, as the demo did.
      const firstKey = Object.keys(next)[0];
      if (firstKey) {
        const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        el?.focus();
      }
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const body = (await res.json()) as { firstName: string; email: string };
      setSent(body);
    } catch {
      setFormError(
        `Something went wrong sending that. Please email ${SITE.email} directly — it reaches the same inbox.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card padding="lg">
        <div ref={doneRef} tabIndex={-1} className="outline-none">
          <h2 className="font-display text-[1.6rem] font-bold tracking-tight">
            Thanks, {sent.firstName}.
          </h2>
          <p className="text-ink-2 mt-3 leading-relaxed">
            We will reply to {sent.email} with the questions we would ask first, usually{' '}
            {SITE.replyTime}.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <form
        ref={formRef}
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        noValidate
      >
        <div
          className="border-field bg-surface inline-grid grid-flow-col gap-0.5 rounded-full border-[1.5px] p-1"
          role="radiogroup"
          aria-label="What would you like to do?"
        >
          {(
            [
              ['assessment', 'Request an assessment'],
              ['talk', 'Describe a problem'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="intent"
                value={value}
                checked={intent === value}
                onChange={() => setIntent(value)}
                className="sr peer"
              />
              <span
                className={cn(
                  'flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 text-[0.92rem] font-semibold',
                  'peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
                  intent === value ? 'bg-brand text-on-brand' : 'text-ink-2',
                )}
              >
                {label}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="lf-name" error={errors.name}>
              <Input
                id="lf-name"
                name="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'lf-name-error' : undefined}
              />
            </Field>
            <Field label="Work email" htmlFor="lf-email" error={errors.email}>
              <Input
                id="lf-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'lf-email-error' : undefined}
              />
            </Field>
          </div>

          <Field label="Company" htmlFor="lf-company" optional>
            <Input id="lf-company" name="company" autoComplete="organization" />
          </Field>

          <Field label="Where does it hurt most?" htmlFor="lf-area" error={errors.problemArea}>
            <Select
              id="lf-area"
              name="problemArea"
              defaultValue=""
              aria-invalid={!!errors.problemArea}
              aria-describedby={errors.problemArea ? 'lf-area-error' : undefined}
            >
              <option value="" disabled>
                Choose one
              </option>
              {Object.entries(PROBLEM_AREA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="What are you trying to fix?" htmlFor="lf-message" error={errors.message}>
            <Textarea
              id="lf-message"
              name="message"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'lf-message-error' : undefined}
            />
          </Field>

          {/* Honeypot: invisible to a person, irresistible to a bot. */}
          <div aria-hidden className="sr">
            <label htmlFor="lf-website">Leave this field empty</label>
            <input id="lf-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <Consent id="lf-contact-consent" name="contactConsent" error={errors.contactConsent}>
            I agree that Beekal may store what I send here and reply to me about it. Nothing else.{' '}
            <a href="/privacy" className="text-ink underline underline-offset-4">
              How we handle your information
            </a>
          </Consent>

          {/*
            A SEPARATE, unticked box. The privacy copy promises no mailing list,
            so replying to someone must never enrol them in a sequence. The
            sequence runner checks this flag, not the one above.
          */}
          <Consent id="lf-marketing-consent" name="marketingConsent">
            Optionally, send me occasional articles about business systems. Unsubscribe any time.
          </Consent>

          <Button type="submit" full disabled={submitting}>
            {submitting
              ? 'Sending…'
              : intent === 'assessment'
                ? 'Request an assessment'
                : 'Send this to Beekal'}
          </Button>
        </div>

        <p className="text-ink-2 mt-3 text-center text-[0.88rem]">
          We reply by email, usually {SITE.replyTime}.
        </p>

        {formError && (
          <p role="alert" className="text-danger mt-3 text-[0.92rem] font-medium">
            {formError}
          </p>
        )}
      </form>
    </Card>
  );
}
