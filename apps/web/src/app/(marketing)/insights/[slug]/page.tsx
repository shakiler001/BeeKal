import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Button, Section, Tag, Wrap } from '@/components/ui';
import type { Block } from '@/content/articles';
import { getArticle, getArticles } from '@/lib/content/articles';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';

/** An article published after the build renders on its first request. */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: 'article',
      publishedTime: article.publishedAt,
      tags: [...article.tags],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Insights', path: '/insights' },
              { name: article.title, path: `/insights/${article.slug}` },
            ]),
          ),
        }}
      />

      <Section>
        <Wrap>
          <Link href="/insights" className="text-ink-2 hover:text-ink text-[0.9rem]">
            &larr; Insights
          </Link>

          <article className="mt-6">
            <header className="max-w-[46ch]">
              <h1 className="text-heading text-[clamp(2rem,1.5rem+2.4vw,3.1rem)] leading-[1.08] font-extrabold tracking-[-0.04em]">
                {article.title}
              </h1>
              <p className="text-ink-2 mt-4 text-[1.05rem] leading-relaxed">{article.excerpt}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {article.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                <span className="text-ink-2 tabular text-[0.85rem]">
                  {article.readMinutes} min read
                </span>
              </div>
            </header>

            <div className="mt-10 max-w-[68ch]">
              {article.body.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
            </div>
          </article>

          <div className="border-line mt-14 max-w-[68ch] border-t pt-10">
            <h2 className="max-w-[26ch] text-[clamp(1.4rem,1.15rem+1.2vw,1.9rem)] leading-tight font-bold tracking-[-0.03em]">
              Recognise this in your own operation?
            </h2>
            <p className="text-ink-2 mt-3">
              Describe it and we will tell you what we would ask first.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact?intent=talk">Describe your problem</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/score">Score your business</Link>
              </Button>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="font-display mt-10 mb-3 text-[1.35rem] font-bold tracking-[-0.025em]">
          {block.text}
        </h2>
      );
    case 'p':
      return <p className="mt-4 text-[1.05rem] leading-relaxed">{block.text}</p>;
    case 'list':
      return (
        <ul className="mt-4 grid gap-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[1.05rem] leading-relaxed">
              <span aria-hidden className="bg-brand mt-2.5 size-1.5 flex-none rounded-full" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="border-accent my-8 border-l-4 pl-5">
          <p className="font-display text-[1.15rem] leading-snug font-semibold tracking-[-0.02em]">
            {block.text}
          </p>
          {block.attribution && (
            <cite className="text-ink-2 mt-2 block text-[0.9rem] not-italic">
              {block.attribution}
            </cite>
          )}
        </blockquote>
      );
  }
}
