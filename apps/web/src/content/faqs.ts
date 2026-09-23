/**
 * FAQ entries, ported from the demo.
 *
 * These are booking objections, which is why they live on /assessment rather
 * than the homepage (docs/02 section 4). The FAQPage structured data is
 * generated from these same records, so the markup and the visible page cannot
 * disagree.
 */

export interface Faq {
  /** Where it appears. A string, not a union: groups are data now. */
  group: string;
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    group: 'assessment',
    question: 'What does it cost?',
    answer:
      'A fixed price, agreed in writing before we start. It depends on the size of your business and how many systems are involved — no hourly billing, no surprises on the invoice.',
  },
  {
    group: 'assessment',
    question: 'What if it does not turn up anything useful?',
    answer:
      'The first thing we do is map exactly where your time and money are leaking, so that is unlikely. But if we do not think an assessment is the right next step for your business, we will say so on the first call — before any money changes hands.',
  },
  {
    group: 'assessment',
    question: 'How long does it take?',
    answer:
      'Two to three weeks, kickoff to roadmap review — scheduled around your operations, not the other way round.',
  },
  {
    group: 'assessment',
    question: 'How much of our time do you need?',
    answer:
      'About six hours in total: interviews with four to six people who do the work, a systems walkthrough, and one final review. We do the rest without you in the room.',
  },
  {
    group: 'assessment',
    question: 'Do we have to build with you afterwards?',
    answer:
      'No. The roadmap names systems and priorities, not vendors — another team can act on it. We would rather be chosen for the build than assumed into it.',
  },
  {
    group: 'assessment',
    question: 'Is what we share kept confidential?',
    answer:
      'Yes. We sign a mutual NDA before the first interview. Nothing you share ever appears in a case study without your written approval.',
  },
  {
    group: 'assessment',
    question: 'We already know what we want built. Do we still need this?',
    answer:
      'Not always. If your requirements are written down and everyone agrees on them, we can go straight to a proposal. The assessment is for when priority is not settled — or when people would describe the problem differently.',
  },
];

export const ASSESSMENT_FAQS = FAQS.filter((f) => f.group === 'assessment');
