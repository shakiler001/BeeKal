import type { SolutionKey } from './solutions';

/**
 * The five problems, as the buyer would describe them.
 *
 * The site lets people self-identify by problem, never by technology
 * (master prompt section 14). One record renders the homepage card and the
 * /problems/[slug] landing page that cold traffic and ads point at.
 */

/**
 * A problem's stable identifier. A plain string for the same reason
 * `SolutionKey` is: these are database rows, and a closed union would make the
 * type system disagree with the data the moment one is added.
 */
export type ProblemKey = string;

export interface Problem {
  key: ProblemKey;
  slug: string;
  /** Homepage card: the question, then the answer. */
  cardHeadline: string;
  cardAnswer: string;
  cardBody: string;
  /** /problems/[slug] */
  pageHeadline: string;
  pageIntro: string;
  /** "If three of these five are true..." */
  diagnostic: string[];
  causes: string;
  fixLooksLike: string[];
  solutionKey: SolutionKey;
  seoTitle: string;
  seoDescription: string;
}

export const PROBLEMS: Problem[] = [
  {
    key: 'manual-work',
    slug: 'manual-work',
    cardHeadline: 'Too much repetitive work?',
    cardAnswer: 'Automate it.',
    cardBody: 'Work that has to happen, but does not have to be done by a person.',
    pageHeadline: 'Two people. Every morning. Rebuilding the same report.',
    pageIntro:
      'Repetitive work is rarely a sign that you need more people. It is usually a sign that two systems are not talking, and a person has been hired to stand between them.',
    diagnostic: [
      'Someone re-types data that already exists in another system.',
      'A recurring report is assembled by hand on the same day every month.',
      'Approvals travel by email and stall while everyone waits on everyone.',
      'Files are copied between folders, or between people, as a routine.',
      'When someone is on leave, a process simply stops.',
    ],
    causes:
      'Almost always, two systems that should exchange data cannot, so a person became the integration. It looks like a staffing problem and it is an architecture problem.',
    fixLooksLike: [
      'Data is entered once and appears everywhere it is needed.',
      'Approvals sit in a queue with a name against them.',
      'Reports arrive on schedule without anyone assembling them.',
      'People spend their time on the exceptions, which is where judgement belongs.',
    ],
    solutionKey: 'automate',
    seoTitle: 'Too Much Manual Work in Your Business?',
    seoDescription:
      'If your team re-enters data, chases approvals by email and rebuilds the same reports by hand, the problem is usually two systems that cannot talk. Here is how that gets fixed.',
  },
  {
    key: 'disconnected-systems',
    slug: 'disconnected-systems',
    cardHeadline: 'Your software does not talk to each other?',
    cardAnswer: 'Connect them.',
    cardBody: 'You bought good products. They just do not know about one another.',
    pageHeadline: 'We have software everywhere, but running the business is still difficult.',
    pageIntro:
      'This is the sentence we hear most often, and it is usually said by someone who has done nothing wrong. Every product was a sensible purchase. The problem is that nobody bought the thing that makes them one system, because nobody sells it.',
    diagnostic: [
      'The same customer, order or employee exists in three systems with three spellings.',
      'A question that spans two departments needs a person from each to answer it.',
      'Reports are built by exporting from several systems into a spreadsheet.',
      'Nobody is certain which system holds the correct number.',
      'Adding another product has been suggested as the fix.',
    ],
    causes:
      'Each product owns its own copy of the truth, and no system owns the relationship between them. Adding a seventh product adds a seventh copy.',
    fixLooksLike: [
      'One system is the agreed owner of each fact, and the others follow it.',
      'Data moves between systems automatically, in one direction, on purpose.',
      'A question that spans departments is answered by looking in one place.',
      'Reporting reads from one source, so two people get the same number.',
    ],
    solutionKey: 'automate',
    seoTitle: 'Your Business Systems Do Not Talk to Each Other',
    seoDescription:
      'Disconnected software means duplicate data, manual reporting and no single source of truth. Integration, not another product, is usually the answer.',
  },
  {
    key: 'legacy-software',
    slug: 'legacy-software',
    cardHeadline: 'Your old system is holding the business back?',
    cardAnswer: 'Modernize it.',
    cardBody: 'Keep the logic that took a decade to get right. Remove what is limiting it.',
    pageHeadline: 'Your old system is not the problem. Being unable to connect to it is.',
    pageIntro:
      'The instinct is to replace it. But that system encodes years of decisions about how your business actually works — decisions nobody wrote down. Replacing it means rediscovering all of them, under deadline, while the business runs.',
    diagnostic: [
      'The system works, but nothing modern can connect to it.',
      'The person who built it has left, and changes have stopped.',
      'A new report takes weeks, or is simply not possible.',
      'It runs on a version of something that is no longer supported.',
      'You have been quoted for a full rebuild and the number was alarming.',
    ],
    causes:
      'The logic is usually sound — it has been tested by a decade of real use. What has aged is the architecture around it: no API, reports hard-coded into the client, direct database access as the only way in.',
    fixLooksLike: [
      'A documented API in front of the system that already works.',
      'Reporting on a read replica, so it stops competing with daily use.',
      'The worst interfaces replaced first, the working core left alone.',
      'A staged cutover, one site or module at a time, with no single risky date.',
    ],
    solutionKey: 'modernize',
    seoTitle: 'Legacy Software Holding Your Business Back?',
    seoDescription:
      'Legacy systems usually encode business logic worth keeping. Modernization through APIs and staged migration beats a risky full rewrite. Here is how to tell which you need.',
  },
  {
    key: 'ai-opportunity',
    slug: 'ai-opportunity',
    cardHeadline: 'You know AI could help but not where?',
    cardAnswer: 'Find the opportunities.',
    cardBody: 'The useful answer is usually narrower, and less exciting, than the pitch.',
    pageHeadline: 'The question is not whether to use AI. It is where it removes real work.',
    pageIntro:
      'Most AI proposals start with a capability and hunt for a use. That order produces pilots that impress in a demo and never reach production. The order that works is the opposite: start with a question your business needs answered, then decide whether intelligence is the cheapest way to answer it.',
    diagnostic: [
      'The answer exists in a document, and finding it takes half an hour.',
      'People extract the same fields from PDFs and scans, by hand, every week.',
      'Your support team answers the same questions over and over.',
      'Institutional knowledge lives with two people, and one is retiring.',
      'You have run an AI pilot that impressed everyone and then stopped.',
    ],
    causes:
      'AI fails in business not because the models are weak but because nobody defined which decision would be made differently. A capability without a decision attached is a demo.',
    fixLooksLike: [
      'One use case in production, measured against what it replaced.',
      'Answers that cite the source document, so people can verify them.',
      'Documents read once into structured data rather than re-read by people.',
      'A person in the loop wherever being wrong would be expensive.',
    ],
    solutionKey: 'ai',
    seoTitle: 'Where Should Your Business Actually Use AI?',
    seoDescription:
      'AI helps where it removes specific, measurable work: searchable institutional knowledge, document extraction, repeat questions. Find the opportunities before buying the technology.',
  },
  {
    key: 'new-product',
    slug: 'new-product',
    cardHeadline: 'You have a product or business idea?',
    cardAnswer: 'Build it.',
    cardBody: 'Start with the smallest version that proves the idea, not the full vision.',
    pageHeadline: 'Build the smallest version that can prove you are right.',
    pageIntro:
      'The most expensive way to build a product is to build all of it before anyone uses any of it. The work is deciding what the first version must do, and being honest about everything it can leave out.',
    diagnostic: [
      'You have an idea that customers have asked for more than once.',
      'You are not sure which part to build first.',
      'You have a spreadsheet or manual process that already works, at small scale.',
      'You need something real enough to show a customer or an investor.',
      'You do not have an in-house engineering team yet.',
    ],
    causes:
      'Not a problem so much as a decision: what is the smallest thing that tests the riskiest assumption? Most first versions are too large because that question was never asked.',
    fixLooksLike: [
      'A first version scoped to one assumption worth testing.',
      'Something real in front of users in weeks, not quarters.',
      'An architecture that can grow, without paying for that growth now.',
      'Clear ownership of the code and the accounts, from day one.',
    ],
    solutionKey: 'build',
    seoTitle: 'Turn Your Product Idea Into Working Software',
    seoDescription:
      'Beekal builds first versions scoped to prove the idea — real software in front of users in weeks, with an architecture that can grow when it needs to.',
  },
];

const BY_KEY = new Map(PROBLEMS.map((p) => [p.key, p]));

/** Undefined for a key that names no problem page. */
export function problemByKey(key: string): Problem | undefined {
  return BY_KEY.get(key);
}
