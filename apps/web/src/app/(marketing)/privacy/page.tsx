import type { Metadata } from 'next';
import { Section, SectionHeader, Wrap } from '@/components/ui';
import { SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'How We Handle Your Information',
  description:
    'What Beekal collects, why, how long it is kept and how to have it deleted. Short, because we collect very little.',
  alternates: { canonical: '/privacy' },
};

/**
 * Expanded from the demo's privacy accordion, keeping its tone.
 *
 * Every promise here is enforced somewhere in the system rather than merely
 * stated: separate consent columns, a 24-month retention job, cookie-free
 * analytics, and the illustrative flag on case studies.
 */
export default function PrivacyPage() {
  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Privacy"
          title="How we handle your information."
          lede="Short, because we collect very little."
          headingLevel="h1"
        />

        <div className="mt-10 max-w-[68ch] space-y-8 leading-relaxed">
          <Part title="What we collect">
            <p>
              Only what you type into a form: your name, email, optionally your company, and what
              you tell us about your problem. We also record how you arrived — the referring page or
              campaign — so we know which of our own efforts are worth continuing.
            </p>
          </Part>

          <Part title="What we do with it">
            <p>
              We reply to you. That is the whole purpose. We never sell it, never share it outside
              Beekal, and never add you to a mailing list because you contacted us.
            </p>
            <p>
              If you separately tick the box asking for occasional articles, that is a different
              permission and we treat it as one. You can withdraw it without affecting anything
              else, and every email carries an unsubscribe link that works.
            </p>
          </Part>

          <Part title="The maturity score">
            <p>
              You can complete the maturity score without giving us anything. Your answers are
              scored in your browser and you see the result immediately. We keep anonymous
              aggregates so we can say useful things about patterns across businesses; those cannot
              be traced back to you.
            </p>
          </Part>

          <Part title="Analytics">
            <p>
              We use self-hosted, cookie-free analytics. No cross-site tracking, no advertising
              identifiers, and no data leaving our own servers. That is also why this site has no
              cookie banner: there is nothing to consent to.
            </p>
          </Part>

          <Part title="How long we keep it">
            <p>
              Enquiries that do not become work are deleted after 24 months. Client records are kept
              for as long as the relationship lasts, plus whatever the law requires afterwards.
            </p>
          </Part>

          <Part title="Getting it deleted">
            <p>
              Email{' '}
              <a href={`mailto:${SITE.email}`} className="text-ink underline underline-offset-4">
                {SITE.email}
              </a>{' '}
              and ask. We will delete everything we hold about you and confirm when it is done. You
              can also ask for a copy, and we will send it.
            </p>
          </Part>

          <Part title="Client confidentiality">
            <p>
              Engagement work is covered by a mutual NDA signed before the first interview. Nothing
              a client shares appears in a case study without their written approval — which is why
              the case studies on this site are labelled as example scenarios until a client says
              otherwise.
            </p>
          </Part>
        </div>
      </Wrap>
    </Section>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
