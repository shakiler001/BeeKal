import type { Metadata } from 'next';
import {
  Accordion,
  Button,
  Card,
  Consent,
  Dots,
  Eyebrow,
  Field,
  Input,
  Metric,
  Section,
  SectionHeader,
  Select,
  Tag,
  Textarea,
  ThemeToggle,
  Wrap,
} from '@/components/ui';
import { Bee, BeeMark, CheckIcon, Logo, LogoWithTagline } from '@/components/brand';

/**
 * Design system reference. Every primitive on one page, so a regression in the
 * port shows up somewhere a human actually looks.
 *
 * Not indexed, and not linked from anywhere in the site navigation.
 */
export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
};

// Class names are written out in full: Tailwind scans source text, so a
// constructed `bg-${token}` produces no CSS at all.
const SWATCHES = [
  { token: 'bg', label: 'Page background', swatch: 'bg-bg' },
  { token: 'bg-alt', label: 'Alternate band', swatch: 'bg-bg-alt' },
  { token: 'surface', label: 'Card surface', swatch: 'bg-surface' },
  { token: 'brand', label: 'Action', swatch: 'bg-brand' },
  { token: 'brand-soft', label: 'Action, soft', swatch: 'bg-brand-soft' },
  { token: 'accent', label: 'Accent', swatch: 'bg-accent' },
  { token: 'ink', label: 'Text', swatch: 'bg-ink' },
  { token: 'ink-2', label: 'Text, secondary', swatch: 'bg-ink-2' },
  { token: 'line', label: 'Divider', swatch: 'bg-line' },
  { token: 'line-2', label: 'Divider, strong', swatch: 'bg-line-2' },
  { token: 'field', label: 'Control border (WCAG 1.4.11)', swatch: 'bg-field' },
  { token: 'danger', label: 'Error', swatch: 'bg-danger' },
] as const;

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-line border-t py-8 first:border-t-0">
      <h2 className="font-display mb-5 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <Section as="main" className="min-h-dvh">
      <Wrap>
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <Eyebrow>Reference</Eyebrow>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3rem)] font-extrabold tracking-[-0.045em]">
              Design system
            </h1>
            <p className="text-ink-2 mt-2">
              Ported from the demo. Toggle the theme to check every pair.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Row title="Brand">
          <div className="flex flex-wrap items-end gap-8">
            <Logo />
            <LogoWithTagline />
            <BeeMark />
            <Bee className="h-10 w-auto" />
            <CheckIcon className="text-brand size-7" />
          </div>
        </Row>

        <Row title="Colour">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SWATCHES.map(({ token, label, swatch }) => (
              <div key={token} className="border-line overflow-hidden rounded-[var(--r-sm)] border">
                <div className={`h-14 ${swatch}`} />
                <div className="bg-surface p-3">
                  <code className="text-[0.8rem] font-semibold">--{token}</code>
                  <p className="text-ink-2 mt-0.5 text-[0.78rem]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </Row>

        <Row title="Type">
          <div className="space-y-3">
            <h1 className="text-heading text-[clamp(2.2rem,1.6rem+3vw,4rem)] leading-[1.05] font-extrabold tracking-[-0.045em]">
              Stop running six systems to run one business.
            </h1>
            <h2 className="text-[clamp(1.75rem,1.3rem+2vw,2.6rem)] leading-[1.12] font-bold tracking-[-0.035em]">
              Every project starts with the problem.
            </h2>
            <h3 className="font-display text-xl font-semibold tracking-tight">Section heading</h3>
            <p className="max-w-[60ch] text-[1.05rem] leading-relaxed">
              Body copy. We turn scattered spreadsheets, chats and old software into one connected
              system.
            </p>
            <p className="text-ink-2 max-w-[60ch]">Secondary copy, for supporting detail.</p>
            <p className="tabular text-2xl font-bold">1,234,567 &middot; 0123456789</p>
          </div>
        </Row>

        <Row title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Request an assessment</Button>
            <Button variant="ghost">Describe your problem</Button>
            <Button variant="accent">Accent</Button>
            <Button size="sm">Small</Button>
            <Button size="sm" variant="ghost">
              Small ghost
            </Button>
            <Button disabled>Disabled</Button>
            <Button asChild>
              <a href="#top">As a link</a>
            </Button>
          </div>
        </Row>

        <Row title="Section header">
          <SectionHeader
            eyebrow="What we fix"
            title="Every project starts with the problem, not the technology."
            lede="Pick the one that sounds like your week."
          />
        </Row>

        <Row title="Cards, metrics, tags">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <h3 className="font-display font-semibold">Surface card</h3>
              <p className="text-ink-2 mt-2 text-[0.95rem]">Default tone, small elevation.</p>
            </Card>
            <Card tone="alt" elevation="none">
              <h3 className="font-display font-semibold">Alt card</h3>
              <p className="text-ink-2 mt-2 text-[0.95rem]">No shadow, band background.</p>
            </Card>
            <Card tone="outline" elevation="none">
              <Metric value="~2 hours" label="of each morning returned to real work" />
              <Metric value="3 days → same day" label="month-end close" />
            </Card>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {['Business processes', 'Data flow', 'Manual work', 'Integrations', 'Security'].map(
              (t) => (
                <Tag key={t}>{t}</Tag>
              ),
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              Impact <Dots value={4} label="Impact" />
            </span>
            <span className="flex items-center gap-2">
              Effort <Dots value={2} label="Effort" />
            </span>
          </div>
        </Row>

        <Row title="Accordion">
          <div className="max-w-[70ch]">
            <Accordion summary="What does it cost?" defaultOpen>
              <p>
                A fixed price, agreed in writing before we start. No hourly billing, no surprises on
                the invoice.
              </p>
            </Accordion>
            <Accordion summary="What you receive" count="11 documents">
              <ul className="space-y-1.5">
                {['Current-state process map', 'Problem register', 'Prioritized roadmap'].map(
                  (d) => (
                    <li key={d} className="flex items-center gap-2">
                      <CheckIcon className="text-brand size-4 flex-none" />
                      {d}
                    </li>
                  ),
                )}
              </ul>
            </Accordion>
            <Accordion summary="Do we have to build with you afterwards?">
              <p>No. The roadmap names systems and priorities, not vendors.</p>
            </Accordion>
          </div>
        </Row>

        <Row title="Form">
          <Card className="max-w-[560px]">
            <div className="grid gap-4">
              <Field label="Your name" htmlFor="ds-name">
                <Input id="ds-name" autoComplete="name" />
              </Field>
              <Field label="Work email" htmlFor="ds-email" error="Enter a valid email address">
                <Input id="ds-email" type="email" aria-invalid defaultValue="not-an-email" />
              </Field>
              <Field label="Company" htmlFor="ds-company" optional>
                <Input id="ds-company" />
              </Field>
              <Field label="Where does it hurt most?" htmlFor="ds-area">
                <Select id="ds-area" defaultValue="">
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option>Too much manual work</option>
                  <option>Systems that do not connect</option>
                  <option>Legacy software</option>
                </Select>
              </Field>
              <Field label="What are you trying to fix?" htmlFor="ds-msg">
                <Textarea id="ds-msg" />
              </Field>
              <Consent id="ds-consent">
                Beekal may store what I send here and reply to me about it. Nothing else.
              </Consent>
              <Button full>Request an assessment</Button>
            </div>
          </Card>
        </Row>
      </Wrap>
    </Section>
  );
}
