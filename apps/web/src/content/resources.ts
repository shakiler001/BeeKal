/**
 * Lead magnets.
 *
 * Ordered by build cost, as named in master prompt section 18. Each one solves
 * a NARROW problem COMPLETELY rather than teasing — `$100M Leads` is explicit
 * that a magnet which withholds the useful part trains people to ignore the
 * next one (docs/01 section 5).
 *
 * The maturity score is the interactive one and lives at /score; it is listed
 * here ungated so the library reads as a complete set.
 */

export interface Resource {
  slug: string;
  title: string;
  description: string;
  kind: 'checklist' | 'guide' | 'tool';
  /** What they actually get. Listed BEFORE the email is asked for. */
  contents: string[];
  isGated: boolean;
  /** Set once the PDF exists. Until then the resource stays a draft. */
  fileUrl: string | null;
  /** For the tool, which is a page rather than a file. */
  href?: string;
  seoTitle: string;
  seoDescription: string;
}

export const RESOURCES: Resource[] = [
  {
    slug: 'business-system-maturity-score',
    title: 'Business System Maturity Score',
    description:
      'Nine questions, two minutes. Find out which of the five levels your business is on, where it is weakest, and what to look at first.',
    kind: 'tool',
    contents: [
      'Your level, on a five-point scale from Manual to Intelligent',
      'A chart across all nine dimensions',
      'Your two weakest dimensions, named',
      'What to look at first, and why',
    ],
    isGated: false,
    fileUrl: null,
    href: '/score',
    seoTitle: 'Business System Maturity Score',
    seoDescription:
      'Free, instant, no email required. Nine questions that tell you which maturity level your business operates at and what is holding it there.',
  },
  {
    slug: 'business-automation-checklist',
    title: 'Business Automation Checklist',
    description:
      'The 40 questions we ask when looking for automation in an operation, in the order we ask them. Work through it and you will find most of what we would.',
    kind: 'checklist',
    contents: [
      '40 questions, grouped by department',
      'How to spot work that only looks like it needs a person',
      'A scoring sheet to rank what to fix first',
      'The three automations that pay back fastest, and why',
    ],
    isGated: true,
    fileUrl: null,
    seoTitle: 'Business Automation Checklist',
    seoDescription:
      'The 40 questions Beekal asks when hunting for automation in a business, with a scoring sheet to rank what to fix first. Free download.',
  },
  {
    slug: 'legacy-modernization-checklist',
    title: 'Legacy Software Modernization Checklist',
    description:
      'How to tell whether your old system needs replacing or opening up — and how to find out before committing to either.',
    kind: 'checklist',
    contents: [
      'The 12 questions that decide rebuild versus modernize',
      'How to find the business logic nobody wrote down',
      'What a staged cutover actually looks like, week by week',
      'The five questions to ask any vendor who quotes you a rewrite',
    ],
    isGated: true,
    fileUrl: null,
    seoTitle: 'Legacy Software Modernization Checklist',
    seoDescription:
      'Rebuild or modernize? Twelve questions that decide it, how to find undocumented business logic, and what to ask a vendor quoting a rewrite.',
  },
  {
    slug: '50-processes-to-automate',
    title: '50 Processes Businesses Can Automate',
    description:
      'Fifty specific processes, with the systems they usually sit between and a rough sense of what each one costs to leave alone.',
    kind: 'guide',
    contents: [
      '50 processes, named specifically rather than by category',
      'Which systems each one usually sits between',
      'Rough effort and payback for each',
      'The ones we would not automate, and why',
    ],
    isGated: true,
    fileUrl: null,
    seoTitle: '50 Business Processes You Can Automate',
    seoDescription:
      'Fifty specific processes worth automating, the systems they sit between, and rough payback for each — including the ones not worth automating.',
  },
];

export const GATED_RESOURCES = RESOURCES.filter((r) => r.isGated);

/** Only resources with a real file are offered; the rest stay unlisted. */
export const AVAILABLE_RESOURCES = RESOURCES.filter((r) => r.fileUrl !== null || r.href);
