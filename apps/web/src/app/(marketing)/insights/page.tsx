import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, Section, SectionHeader, Tag, Wrap } from '@/components/ui';
import { getPublishedArticles } from '@/lib/content/articles';

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'How to tell when a business has outgrown its systems, why another product rarely fixes disconnected software, and where AI actually pays. Written for operators, not developers.',
  alternates: { canonical: '/insights' },
};

export default async function InsightsPage() {
  const articles = await getPublishedArticles();
  return (
    <Section>
      <Wrap>
        <SectionHeader
          eyebrow="Insights"
          title="How to tell what is actually wrong."
          lede="Written for the person running the business, not the person writing the code. No case for hiring us — just the thinking we would apply."
          headingLevel="h1"
        />

        <ul className="mt-12 grid gap-5 lg:grid-cols-2">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link href={`/insights/${article.slug}`} className="block h-full">
                <Card interactive padding="lg" className="flex h-full flex-col">
                  <h2 className="font-display text-[1.25rem] leading-snug font-bold tracking-[-0.025em]">
                    {article.title}
                  </h2>
                  <p className="text-ink-2 mt-3 leading-relaxed">{article.excerpt}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                    {article.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <span className="text-ink-2 tabular ml-auto text-[0.85rem]">
                      {article.readMinutes} min
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}
