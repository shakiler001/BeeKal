import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Card, Section, Wrap } from '@/components/ui';
import { getResources } from '@/lib/content/resources';
import { ResourceDownloadForm } from '@/features/resources/resource-download-form';

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = (await getResources()).find((item) => item.slug === slug);
  if (!resource || !resource.isGated || !resource.hasFile) return {};
  return {
    title: resource.seoTitle,
    description: resource.seoDescription,
    alternates: { canonical: `/resources/${slug}` },
  };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = (await getResources()).find((item) => item.slug === slug);
  if (!resource || !resource.isGated || !resource.hasFile) notFound();

  return (
    <Section>
      <Wrap>
        <Link href="/resources" className="text-ink-2 hover:text-ink text-[0.9rem]">
          &larr; Resources
        </Link>
        <div className="mt-6 max-w-[68ch]">
          <h1 className="text-heading text-[clamp(2rem,1.5rem+2.4vw,3.1rem)] leading-tight font-extrabold">
            {resource.title}
          </h1>
          <p className="text-ink-2 mt-4 text-lg leading-relaxed">{resource.description}</p>
          <Card padding="lg" className="mt-8">
            <h2 className="font-display text-xl font-bold">What you get</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {resource.contents.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <ResourceDownloadForm slug={slug} />
        </div>
      </Wrap>
    </Section>
  );
}
