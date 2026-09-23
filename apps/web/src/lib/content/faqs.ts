import 'server-only';
import { FAQS as BASELINE, type Faq } from '@/content/faqs';
import { fetchContent } from './source';
import { CONTENT_TAGS } from './tags';

/**
 * FAQs, read from the database.
 *
 * These are booking objections rather than general questions, which is why they
 * sit on /assessment. The same records generate the visible list and the
 * FAQPage structured data, so the markup and the page cannot disagree — which
 * is also why a malformed row is dropped rather than rendered empty: an FAQ
 * entry with no answer is a rich result that says nothing.
 */

interface FaqRow {
  question: unknown;
  answer: unknown;
  group: unknown;
}

function toFaq(row: FaqRow): Faq | null {
  const question = typeof row.question === 'string' ? row.question : '';
  const answer = typeof row.answer === 'string' ? row.answer : '';
  if (!question || !answer) return null;

  return {
    question,
    answer,
    group: typeof row.group === 'string' ? row.group : 'assessment',
  };
}

export async function getFaqs(group?: string): Promise<Faq[]> {
  const rows = await fetchContent<FaqRow[]>('faqs', CONTENT_TAGS.faqs);
  const all = rows === null ? BASELINE : rows.map(toFaq).filter((f): f is Faq => f !== null);
  return group ? all.filter((f) => f.group === group) : all;
}
