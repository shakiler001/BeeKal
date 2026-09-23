/**
 * Articles.
 *
 * The topics come from master prompt section 19. They teach a business owner
 * about a problem before selling anything, which is what builds the authority
 * the flywheel runs on. None of them is "we are great" or "we use the latest
 * technology" — content of that kind persuades nobody and ranks for nothing.
 *
 * Body is a small block structure rather than raw HTML so it can render to a
 * page, to an email, and to a plain-text excerpt from one source.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string; attribution?: string };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  readMinutes: number;
  publishedAt: string;
  body: Block[];
  seoTitle: string;
  seoDescription: string;
}

export const ARTICLES: Article[] = [
  {
    slug: 'signs-your-business-has-outgrown-excel',
    title: 'Five signs your business has outgrown Excel',
    excerpt:
      'Spreadsheets do not fail loudly. They get slower, then someone becomes their keeper, and one day nobody is sure which copy is right.',
    tags: ['Process', 'Data'],
    readMinutes: 5,
    publishedAt: '2026-09-01',
    seoTitle: 'Five Signs Your Business Has Outgrown Excel',
    seoDescription:
      'Spreadsheets fail quietly. Five specific signs that yours has stopped being a tool and started being a liability — and what to do first.',
    body: [
      {
        type: 'p',
        text: 'Excel is not the problem. It is genuinely the best tool ever made for thinking about numbers, and most businesses should use more of it, not less. The problem is what happens when a spreadsheet stops being something one person thinks in and becomes something several people operate.',
      },
      {
        type: 'p',
        text: 'That transition never announces itself. Here is how to notice it has already happened.',
      },
      { type: 'h2', text: '1. Someone has become its keeper' },
      {
        type: 'p',
        text: 'There is a person who understands the file. Changes go through them. When they are on leave, something waits. Nobody decided this; it accumulated. The moment a spreadsheet has a keeper, it has become a system without any of the properties that make systems safe — no access control, no audit trail, no way to tell what changed and who changed it.',
      },
      { type: 'h2', text: '2. There are versions' },
      {
        type: 'p',
        text: 'Not "v2 final" in a filename — that is a joke everyone gets. The real version problem is quieter: two people each have a copy that is correct for their purpose, and both are slightly wrong for the other. Reconciling them is a meeting.',
      },
      { type: 'h2', text: '3. The same number is typed twice' },
      {
        type: 'p',
        text: 'A figure exists in the spreadsheet and also in another system. Somebody keeps them in step by reading one and typing into the other. This is the clearest signal of all, because it is not a spreadsheet problem — it is two systems that were never introduced, with a person standing between them doing the work of an integration.',
      },
      { type: 'h2', text: '4. Answering a question requires assembly' },
      {
        type: 'p',
        text: 'A reasonable question — how many orders are late, what did we ship last month — cannot be answered by looking. It requires exporting, pasting, sorting and a pivot table. If the same assembly happens on the same day each month, that is not reporting. That is manufacturing a report.',
      },
      { type: 'h2', text: '5. You have stopped trusting it, quietly' },
      {
        type: 'p',
        text: 'The strongest sign, and the hardest to admit. People start double-checking. A number gets used in a meeting and someone says "is that the current one?" Nobody says the spreadsheet is wrong, but decisions slow down while everyone privately verifies.',
      },
      { type: 'h2', text: 'What to do about it' },
      {
        type: 'p',
        text: 'Not "buy software". The mistake most businesses make at this point is to purchase a product that covers the spreadsheet\'s job and discover it covers about seventy per cent of it, so the spreadsheet survives alongside the new system and now there are two places to look.',
      },
      {
        type: 'p',
        text: 'Start smaller and more specific. Take the one number that gets typed twice and make it flow. Take the one report that gets assembled and make it arrive. Each of those is a week of work, not a project, and each removes a named cost you can measure afterwards.',
      },
      {
        type: 'quote',
        text: 'The goal is not to eliminate spreadsheets. It is to stop asking a spreadsheet to be a database, a workflow and a permission system at the same time.',
      },
    ],
  },
  {
    slug: 'why-another-product-does-not-fix-disconnected-systems',
    title: 'Why adding another product does not fix disconnected systems',
    excerpt:
      'Every product you own was a sensible purchase. The thing that is missing is not a product, which is why nobody sold it to you.',
    tags: ['Integration', 'Architecture'],
    readMinutes: 4,
    publishedAt: '2026-09-08',
    seoTitle: 'Why Another Product Will Not Fix Your Disconnected Systems',
    seoDescription:
      'Disconnected software is not a missing-product problem. Each system owns its own copy of the truth, and a seventh product adds a seventh copy.',
    body: [
      {
        type: 'p',
        text: 'A pattern worth recognising: a business has six systems that do not talk to each other, and the proposed fix is a seventh system that promises to bring everything together.',
      },
      {
        type: 'p',
        text: 'Sometimes that works. Usually it produces a seventh system that does not talk to the other six either, plus a migration nobody finished, plus two departments still using what they had before.',
      },
      { type: 'h2', text: 'The actual problem' },
      {
        type: 'p',
        text: 'Each product owns its own copy of the truth. Your CRM believes it knows the customer. Your accounting package believes it knows the customer. Both are right about their part and neither knows about the other. Nothing owns the relationship between them, because no vendor sells that — it is specific to how your business happens to work.',
      },
      {
        type: 'p',
        text: 'A seventh product does not fix this. It adds a seventh copy.',
      },
      { type: 'h2', text: 'What actually fixes it' },
      {
        type: 'list',
        items: [
          'Decide which system owns each fact. Not which is best — which is authoritative. Orders live in one place; everything else reads them.',
          'Make the data move in one direction, on purpose, through APIs the products already have.',
          'Reconcile what does not sync, visibly, so a failure surfaces in minutes rather than at month-end.',
          'Leave the products alone. They are fine. What was missing was the layer between them.',
        ],
      },
      { type: 'h2', text: 'Why this feels unsatisfying' },
      {
        type: 'p',
        text: 'Because it has no logo. There is no demo, no seat pricing, no procurement process — it is a few weeks of specific work that makes the things you already bought behave like one system. It is harder to get approved than a purchase, which is exactly why so many businesses buy the seventh product instead.',
      },
    ],
  },
  {
    slug: 'where-should-a-business-actually-use-ai',
    title: 'Where should a business actually use AI?',
    excerpt:
      'The useful answer is narrower and less exciting than the pitch. Start with a decision you need to make differently, not with a capability.',
    tags: ['AI', 'Strategy'],
    readMinutes: 5,
    publishedAt: '2026-09-15',
    seoTitle: 'Where Should a Business Actually Use AI?',
    seoDescription:
      'Most AI pilots impress in a demo and never reach production, because they start with a capability instead of a decision. Where it genuinely pays.',
    body: [
      {
        type: 'p',
        text: 'Most AI projects in ordinary businesses fail in the same way. They start with a capability — we could use a model for this — and hunt for somewhere to put it. That order produces something that demonstrates well and then quietly stops being used.',
      },
      {
        type: 'p',
        text: 'The order that works is the opposite: start with a question your business needs answered or a decision it makes badly, and only then ask whether intelligence is the cheapest way to improve it. Often it is not, and finding that out early is worth more than the pilot.',
      },
      { type: 'h2', text: 'Where it genuinely pays' },
      {
        type: 'p',
        text: 'Three patterns keep proving themselves in operational businesses.',
      },
      {
        type: 'list',
        items: [
          'Retrieval over your own documents. The answer exists somewhere in a decade of files and finding it takes half an hour. This is the highest-value, lowest-risk use in most businesses, provided every answer cites its source so a person can verify it.',
          'Reading documents at volume. Invoices, specifications, tenders — anything where a person extracts the same fields by hand, repeatedly. The work is dull, high-volume and checkable, which is exactly the shape that suits a model.',
          'The questions that arrive in the same form every day. Not replacing support, but handling the forty questions that make up most of it, and escalating everything else with the context attached.',
        ],
      },
      { type: 'h2', text: 'Where it does not' },
      {
        type: 'p',
        text: 'Anywhere being wrong is expensive and hard to notice. Anywhere the real problem is that two systems do not talk — a model asked to paper over a missing integration is an expensive and unreliable integration. And anywhere the process itself is undefined: intelligence applied to a process nobody has agreed on produces confident answers to the wrong question.',
      },
      { type: 'h2', text: 'The test worth applying' },
      {
        type: 'quote',
        text: 'Which decision will be made differently, by whom, and how will we know if it was better? If those three have no answer, what is being proposed is a demo.',
      },
      {
        type: 'p',
        text: 'That test kills most AI proposals, including several of ours. The ones that survive it tend to be small, specific and boring — and they reach production.',
      },
    ],
  },
];

export const PUBLISHED_ARTICLES = [...ARTICLES].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);
