/**
 * Seeds the content tables from the site's own content modules.
 *
 * This is what makes the migration from demo to product concrete: the copy
 * already written becomes the first rows, and the rewrite happens in the admin
 * UI where it belongs (docs/04 section 5, step 6).
 *
 * Idempotent — existing rows are never overwritten, because by the time this
 * runs a second time an editor may have changed them.
 */
import type { PrismaClient } from '@prisma/client';
import { SOLUTIONS } from '../../web/src/content/solutions.js';
import { PROBLEMS } from '../../web/src/content/problems.js';
import { CASE_STUDIES } from '../../web/src/content/case-studies.js';
import { FAQS } from '../../web/src/content/faqs.js';

export async function seedContent(prisma: PrismaClient): Promise<void> {
  let created = 0;

  for (const [index, s] of SOLUTIONS.entries()) {
    const existing = await prisma.solution.findUnique({ where: { key: s.key } });
    if (existing) continue;
    await prisma.solution.create({
      data: {
        key: s.key,
        slug: s.slug,
        name: s.name,
        cardHeadline: s.cardHeadline,
        cardBody: s.cardBody,
        pageHeadline: s.pageHeadline,
        pageIntro: s.pageIntro,
        signs: [...s.signs],
        whatWeDo: [...s.whatWeDo],
        before: [...s.before],
        after: [...s.after],
        seoTitle: s.seoTitle,
        seoDescription: s.seoDescription,
        order: index,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    created += 1;
  }

  for (const [index, p] of PROBLEMS.entries()) {
    const existing = await prisma.problem.findUnique({ where: { key: p.key } });
    if (existing) continue;
    await prisma.problem.create({
      data: {
        key: p.key,
        slug: p.slug,
        cardHeadline: p.cardHeadline,
        cardAnswer: p.cardAnswer,
        cardBody: p.cardBody,
        pageHeadline: p.pageHeadline,
        pageIntro: p.pageIntro,
        diagnostic: [...p.diagnostic],
        causes: p.causes,
        fixLooksLike: [...p.fixLooksLike],
        solutionKey: p.solutionKey,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        order: index,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    created += 1;
  }

  for (const [index, c] of CASE_STUDIES.entries()) {
    const existing = await prisma.caseStudy.findUnique({
      where: { slug_locale: { slug: c.slug, locale: 'en' } },
    });
    if (existing) continue;
    await prisma.caseStudy.create({
      data: {
        slug: c.slug,
        title: c.title,
        clientName: c.clientName,
        context: c.context,
        solutionKey: c.solutionKey,
        tabLabel: c.tabLabel,
        problem: c.problem,
        beforeLead: c.beforeLead,
        before: c.before,
        diagnosis: c.diagnosis,
        whatChanged: c.whatChanged,
        howBuilt: c.howBuilt,
        // Prisma's Json column needs a plain array, not the readonly interface.
        results: c.results.map((r) => ({ value: r.value, label: r.label })),
        lesson: c.lesson,
        // Every seeded case is illustrative. The check constraint would reject
        // anything else without a named, approved client.
        isIllustrative: c.isIllustrative,
        clientApproved: false,
        featured: c.featured,
        order: index,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    created += 1;
  }

  for (const [index, f] of FAQS.entries()) {
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (existing) continue;
    await prisma.faq.create({
      data: {
        question: f.question,
        answer: f.answer,
        group: f.group,
        order: index,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    created += 1;
  }

  console.info(`  content: ${created} new rows (existing rows left untouched)`);
}
