/**
 * The five solution categories.
 *
 * File-seeded for Phase 2. In Phase 3 these rows move into Postgres and an
 * Editor edits them in the admin — the shape here is deliberately the shape of
 * the `solutions` table (docs/04 section 2.3), so that move is a migration
 * rather than a rewrite.
 *
 * One record renders two ways: the homepage card and /solutions/[slug]. Keeping
 * them in one place is what stops the two copies diverging within a month
 * (docs/02 section 5).
 */

export type SolutionKey = 'build' | 'modernize' | 'automate' | 'ai' | 'care';

export interface Solution {
  key: SolutionKey;
  slug: string;
  name: string;
  /** Homepage card. One sentence, outcome-first. */
  cardHeadline: string;
  cardBody: string;
  /** /solutions/[slug] */
  pageHeadline: string;
  pageIntro: string;
  /** "Three signs you need this" — the reader's symptoms, in their words. */
  signs: string[];
  /** Where technology is finally allowed to appear. */
  whatWeDo: string[];
  before: string[];
  after: string[];
  seoTitle: string;
  seoDescription: string;
}

export const SOLUTIONS: Solution[] = [
  {
    key: 'build',
    slug: 'build',
    name: 'Beekal Build',
    cardHeadline: 'One system where the work actually happens.',
    cardBody:
      'Custom business software for the process no off-the-shelf product fits — built around how your business already works.',
    pageHeadline: 'One system where the work happens, instead of six that half-agree.',
    pageIntro:
      'When the process that runs your business lives across spreadsheets, chat threads and three products that were never meant to talk, the answer is not a seventh product. It is one system built around the work you actually do.',
    signs: [
      'The same information is entered more than once, by different people, in different places.',
      'Nobody can answer a basic question — order status, stock, who approved this — without asking someone.',
      'You have looked at off-the-shelf products and every one covers about 70% of what you need.',
    ],
    whatWeDo: [
      'Map the process as it runs today, including the parts nobody documented.',
      'Design one record that every department reads and one place each fact is entered.',
      'Build the system — web or mobile, role-based access, on your infrastructure or ours.',
      'Integrate with what you keep: accounting, payroll, whatever already works.',
      'Launch in milestones, so value arrives before the end of the project.',
    ],
    before: [
      'Four spreadsheets and a WhatsApp group',
      'Status answered by walking to someone',
      'Reports rebuilt by hand each week',
      'Every department keeps its own copy',
    ],
    after: [
      'One record, owned by the team that runs the process',
      'Status visible to whoever needs it',
      'Reports that arrive without being built',
      'One place each fact is entered',
    ],
    seoTitle: 'Custom Business Software Development',
    seoDescription:
      'Beekal builds custom business systems — ERP, CRM, internal applications and portals — designed around how your business actually operates. Start with an assessment.',
  },
  {
    key: 'modernize',
    slug: 'modernize',
    name: 'Beekal Modernize',
    cardHeadline: 'Keep the logic. Remove the limits around it.',
    cardBody:
      'Your old system still knows things it took a decade to learn. We open it up instead of throwing it away.',
    pageHeadline: 'Your old system is not the problem. Being unable to connect to it is.',
    pageIntro:
      'Most modernization proposals start with "rebuild everything". That throws away business logic that took years of real use to get right, and it puts the whole operation at risk on a single cutover date. There is almost always a better route.',
    signs: [
      'The system still does its job, but nothing new can connect to it.',
      'Any change means a request to a developer who may no longer work there.',
      'Reports are hard-coded, and getting a new one takes weeks.',
    ],
    whatWeDo: [
      'Find out what the existing system knows — the rules encoded in a decade of use.',
      'Put a documented API in front of it, so other systems can finally reach it.',
      'Move reporting onto a read replica, so it stops competing with daily work.',
      'Replace the worst interfaces first, leaving the working core alone.',
      'Cut over in stages — one site, one department, one module at a time.',
    ],
    before: [
      'A closed system nothing can reach',
      'Changes blocked on one person',
      'Reporting fights with daily use',
      'A rewrite quoted as the only option',
    ],
    after: [
      'A documented API other systems use',
      'Changes that do not need the original author',
      'Reporting that runs on its own copy',
      'Value delivered in stages, no big-bang risk',
    ],
    seoTitle: 'Legacy Software Modernization',
    seoDescription:
      'Beekal modernizes legacy business systems without discarding the logic that works — APIs, staged migration and architecture improvement instead of a risky rewrite.',
  },
  {
    key: 'automate',
    slug: 'automate',
    name: 'Beekal Automate',
    cardHeadline: 'Stop paying people to move data between systems.',
    cardBody:
      'The copying, the re-keying, the chasing for approval. Work that needs doing, but not by a person.',
    pageHeadline: 'Stop paying people to move data between the systems you already own.',
    pageIntro:
      'Somewhere in your operation, someone opens one screen, reads a number, and types it into another. Multiply that by everyone who does it, every day. That is not a people problem — it is two systems that were never introduced.',
    signs: [
      'Someone re-enters the same data into a second system as part of their routine.',
      'Approvals travel by email and stall because nobody knows whose turn it is.',
      'A recurring report is assembled by hand on a fixed day every month.',
    ],
    whatWeDo: [
      'Follow one process end to end and count where the time actually goes.',
      'Connect the systems that should have been talking, through their APIs.',
      'Move approvals into a workflow with a visible queue and an owner.',
      'Schedule what runs on a clock, so nobody has to remember it.',
      'Alert on the exceptions, so people look only where judgement is needed.',
    ],
    before: [
      'The same number typed into two systems',
      'Approvals lost in email threads',
      'Month-end assembled by hand',
      'Errors found downstream, late',
    ],
    after: [
      'Data entered once, synced automatically',
      'Approvals in a queue with an owner',
      'Reports that arrive on schedule',
      'Exceptions flagged when they happen',
    ],
    seoTitle: 'Business Process Automation & System Integration',
    seoDescription:
      'Beekal removes repetitive operational work by connecting the systems your team already uses — workflow automation, approvals, integrations and scheduled reporting.',
  },
  {
    key: 'ai',
    slug: 'ai',
    name: 'Beekal AI',
    cardHeadline: 'Make what your company already knows answerable.',
    cardBody:
      'Years of documents, contracts and correspondence that nobody can search. AI where it removes real work — and nowhere else.',
    pageHeadline: 'Make what your company already knows answerable in one question.',
    pageIntro:
      'We will tell you plainly where AI is the wrong answer, because that is more useful than enthusiasm. Where it earns its place is narrow and specific: making scattered institutional knowledge reachable, reading documents at a volume people cannot, and handling the questions that arrive in the same shape every day.',
    signs: [
      'The answer exists in a document somewhere, and finding it takes half an hour.',
      'People re-read the same contracts and specifications to extract the same fields.',
      'Your support team answers the same forty questions every week.',
    ],
    whatWeDo: [
      'Start with a question you actually need answered, not with a model.',
      'Build retrieval over your own documents, with citations back to the source.',
      'Extract structured fields from documents that arrive as PDFs and scans.',
      'Keep a person in the loop wherever being wrong would be expensive.',
      'Measure whether it removed work. If it did not, we say so.',
    ],
    before: [
      'Knowledge locked in files nobody can search',
      'Fields re-typed out of PDFs by hand',
      'The same questions answered repeatedly',
      'AI pilots that never reached production',
    ],
    after: [
      'Answers with a citation to the source document',
      'Documents read once, into structured data',
      'Routine questions handled, exceptions escalated',
      'One use case in production, measured',
    ],
    seoTitle: 'Practical AI for Business Operations',
    seoDescription:
      'Beekal applies AI where it removes real work: knowledge assistants over your own documents, document intelligence, and AI-assisted operations. No AI for its own sake.',
  },
  {
    key: 'care',
    slug: 'care',
    name: 'Beekal Care',
    cardHeadline: 'The system keeps getting better after launch.',
    cardBody:
      'Not maintenance. Monitoring, improvements and a monthly technology review — so the system does not quietly decay.',
    pageHeadline: 'Software does not finish at launch. It either improves or it decays.',
    pageIntro:
      'Most support contracts are insurance against things breaking. That is a cost line, and the first thing cut. Beekal Care is the opposite: a monthly cadence of measured improvement, with a written review you receive whether or not anything went wrong.',
    signs: [
      'The system launched, and then nothing has changed since.',
      'Small improvements queue up behind whoever has time, which is nobody.',
      'You find out something broke because a customer told you.',
    ],
    whatWeDo: [
      'Monitor the things that matter, and tell you before your customers do.',
      'Keep dependencies and security patches current, on a schedule.',
      'Ship small improvements continuously instead of banking them into a project.',
      'Review performance, cost and usage monthly, in writing.',
      'Maintain a visible roadmap, so the next quarter is a decision, not a surprise.',
    ],
    before: [
      'Nothing changes after launch',
      'Failures discovered by customers',
      'Security updates postponed indefinitely',
      'Improvements stuck behind a business case',
    ],
    after: [
      'Steady improvement, monthly',
      'Failures caught by monitoring first',
      'Patching on a schedule',
      'A roadmap you can see and steer',
    ],
    seoTitle: 'Continuous Technology Improvement & Support',
    seoDescription:
      'Beekal Care is continuous technology improvement — monitoring, security updates, performance work and a monthly technology review. Not ordinary maintenance.',
  },
];

export const SOLUTION_BY_KEY = Object.fromEntries(SOLUTIONS.map((s) => [s.key, s])) as Record<
  SolutionKey,
  Solution
>;
