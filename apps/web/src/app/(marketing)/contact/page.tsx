import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Section, SectionHeader, Wrap } from '@/components/ui';
import { LeadForm } from '@/features/lead-form/lead-form';
import { SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell Beekal what you are trying to fix. We will say whether a Business System Assessment is the right first step — or if it is not.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <Section>
      <Wrap>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Start here"
              title="Find what is slowing your business down."
              lede="Tell us what you are trying to fix. We will say whether an assessment is the right first step — or if it is not."
              headingLevel="h1"
            />

            <ol className="mt-8 space-y-4">
              {[
                'You describe the problem in your own words.',
                `${SITE.founderName.split(' ')[0]} replies with the questions he would ask first.`,
                'If it is a fit, we scope your assessment together.',
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="bg-brand-soft text-brand tabular grid size-8 flex-none place-items-center rounded-full font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>

            <div className="border-line mt-10 border-t pt-8">
              <p className="font-display font-semibold">Prefer to write directly?</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href={`mailto:${SITE.email}?subject=Business%20System%20Assessment`}
                    className="text-ink underline underline-offset-4"
                  >
                    {SITE.email}
                  </a>
                </li>
                {SITE.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${SITE.whatsapp}`}
                      className="text-ink underline underline-offset-4"
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
              </ul>
              <p className="text-ink-2 mt-4 text-[0.95rem]">
                {SITE.locationLong} Replies {SITE.replyTime}.
              </p>
            </div>
          </div>

          {/* useSearchParams needs a Suspense boundary during prerender. */}
          <Suspense fallback={<div className="min-h-[600px]" />}>
            <LeadForm />
          </Suspense>
        </div>
      </Wrap>
    </Section>
  );
}
