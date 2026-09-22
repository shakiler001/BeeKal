import Link from 'next/link';
import { LogoWithTagline } from '@/components/brand';
import { SITE } from '@/content/site';
import { SOLUTIONS } from '@/content/solutions';
import { PROBLEMS } from '@/content/problems';

/**
 * The footer carries the full map, including the /problems/* pages that are
 * deliberately absent from the header. Cold-traffic landing pages still need
 * to be crawlable (docs/02 section 2).
 */
export function SiteFooter() {
  return (
    <footer className="bg-foot text-white">
      <div className="mx-auto w-[min(1200px,100%-2*var(--gut))] py-[clamp(48px,6vw,80px)]">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <LogoWithTagline className="h-14 w-auto" />
            <p className="mt-4 max-w-[28ch] text-[0.98rem] text-white/80">{SITE.promise}</p>
          </div>

          <FooterCol title="Solutions">
            {SOLUTIONS.map((s) => (
              <FooterLink key={s.key} href={`/solutions/${s.slug}`}>
                {s.name}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="What we fix">
            {PROBLEMS.map((p) => (
              <FooterLink key={p.key} href={`/problems/${p.slug}`}>
                {p.cardAnswer.replace(/\.$/, '')}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Start here">
            <FooterLink href="/assessment">Business System Assessment</FooterLink>
            <FooterLink href="/score">Maturity score</FooterLink>
            <FooterLink href="/work">Case studies</FooterLink>
            <FooterLink href="/method">How we work</FooterLink>
            <FooterLink href="/about">About Beekal</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/15 pt-8 sm:grid-cols-2">
          <div>
            <h3 className="text-[0.78rem] font-bold tracking-[0.09em] text-white/60 uppercase">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-[0.98rem]">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-white underline-offset-4 hover:underline"
                >
                  {SITE.email}
                </a>
              </li>
              {SITE.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${SITE.whatsapp}`}
                    className="text-white underline-offset-4 hover:underline"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
            <address className="mt-3 text-[0.95rem] text-white/70 not-italic">
              {SITE.name}
              <br />
              {SITE.location}
            </address>
          </div>
          <p className="text-[0.95rem] text-white/70 sm:text-right">
            {SITE.founderName}, {SITE.founderRole}.
            <br />
            Replies {SITE.replyTime}.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-[0.9rem] text-white/60">
          <span>
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          {SITE.legalEntity && (
            <span>
              {SITE.legalEntity}
              {SITE.registrationNumber && ` · Reg. ${SITE.registrationNumber}`}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[0.78rem] font-bold tracking-[0.09em] text-white/60 uppercase">{title}</h3>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[0.98rem] text-white/85 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
