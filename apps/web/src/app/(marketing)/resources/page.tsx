import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, Section, SectionHeader, Tag, Wrap } from '@/components/ui';
import { CheckIcon } from '@/components/brand';
import { getResources } from '@/lib/content/resources';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Checklists and tools Beekal uses in real engagements: the automation checklist, the legacy modernization checklist, and the business system maturity score.',
  alternates: { canonical: '/resources' },
};

const KIND_LABELS = { checklist: 'Checklist', guide: 'Guide', tool: 'Interactive' } as const;

export default async function ResourcesPage() {
  const resources = await getResources();
  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Resources"
          title="The checklists we actually use."
          lede="Not teasers. These are the questions we work through in a real engagement, which means you can work through them yourself and find most of what we would."
          headingLevel="h1"
        />

        <ul className="mt-12 grid gap-5 lg:grid-cols-2">
          {resources.map((resource) => {
            const available =
              resource.href ??
              (resource.isGated && resource.hasFile
                ? `/resources/${resource.slug}`
                : resource.fileUrl);

            return (
              <li key={resource.slug}>
                <Card padding="lg" className="flex h-full flex-col">
                  <div className="flex items-center gap-2">
                    <Tag>{KIND_LABELS[resource.kind]}</Tag>
                    {!resource.isGated && (
                      <span className="text-brand text-[0.78rem] font-bold tracking-wide uppercase">
                        No email needed
                      </span>
                    )}
                  </div>

                  <h2 className="font-display mt-4 text-[1.2rem] leading-snug font-bold tracking-[-0.025em]">
                    {resource.title}
                  </h2>
                  <p className="text-ink-2 mt-2.5 leading-relaxed">{resource.description}</p>

                  <ul className="mt-5 grid gap-2">
                    {resource.contents.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[0.95rem]">
                        <CheckIcon className="text-brand mt-0.5 size-4 flex-none" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    {available ? (
                      <Link
                        href={available}
                        className="text-brand font-semibold underline-offset-4 hover:underline"
                      >
                        {resource.kind === 'tool' ? 'Open the tool' : 'Get it'} &rarr;
                      </Link>
                    ) : (
                      <span className="text-ink-2 text-[0.92rem]">
                        Being written. It will appear here when it is genuinely useful, not before.
                      </span>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <p className="text-ink-2 mt-10 max-w-[60ch] text-[0.95rem] leading-relaxed">
          Downloading a checklist does not put you on a mailing list. If you want occasional
          articles there is a separate box for that, and it is never ticked for you.
        </p>
      </Wrap>
    </Section>
  );
}
