import type { SolutionKey } from './solutions';

/**
 * Case studies, ported verbatim from the demo.
 *
 * EVERY ONE IS MARKED ILLUSTRATIVE, and the badge renders from that flag rather
 * than from a hand-written label. Master prompt section 28 forbids inventing
 * client results; making it a flag means nobody can publish a fabricated result
 * as a real one by forgetting to remove a line of markup.
 *
 * When a real client approves, set isIllustrative: false and fill clientName.
 * In Phase 3 this becomes a database check constraint (docs/04 section 2.3):
 *   is_illustrative = true OR (client_approved AND client_name IS NOT NULL)
 *
 * The `lesson` field — what we would do differently — is mandatory. It is the
 * most credible element on the site precisely because nobody fakes one.
 */

export interface CaseResult {
  value: string;
  label: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  /** null while illustrative. */
  clientName: string | null;
  context: string;
  solutionKey: SolutionKey;
  tabLabel: string;

  // The eight-part format.
  problem: string;
  before: string;
  beforeLead: string;
  diagnosis: string;
  whatChanged: string;
  howBuilt: string;
  results: CaseResult[];
  lesson: string;

  isIllustrative: boolean;
  featured: boolean;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'garment-exporter-order-visibility',
    title: 'One place to answer "where is my order?"',
    clientName: null,
    context: 'Garment exporter · Dhaka · 180 staff',
    solutionKey: 'build',
    tabLabel: 'Garment exporter',
    problem:
      'Buyers asked for order status daily. The answer was rebuilt by hand each time — spreadsheets, email, a walk to the floor.',
    beforeLead: 'Four Excel files. One WhatsApp group.',
    before:
      'Two merchandisers lost most mornings chasing updates — and once quoted two buyers different ship dates for the same order.',
    diagnosis:
      'Not a reporting problem — a record problem. No single order record existed anywhere; every department kept its own copy.',
    whatChanged:
      'One order record, sample to shipment, owned by merchandising. Milestones are entered once on the floor; buyers see that same record, read-only.',
    howBuilt:
      'A web app with role-based access, a tablet entry screen for line supervisors, and a nightly export into their existing accounting package. Three milestones, fourteen weeks.',
    results: [
      {
        value: '~2 hours',
        label: "of each merchandiser's morning returned to actual merchandising",
      },
      {
        value: 'One ship date',
        label: 'per order, visible to the buyer and the factory at the same time',
      },
      {
        value: 'No spreadsheets',
        label: 'order status is no longer maintained in Excel by anyone',
      },
    ],
    lesson:
      'The tablet had to survive gloves and weak wifi. Next time we prototype on the factory floor in week one, not week five.',
    isIllustrative: true,
    featured: true,
  },
  {
    slug: 'pharma-distributor-legacy-api',
    title: 'A 2011 desktop system, opened up instead of replaced.',
    clientName: null,
    context: 'Pharmaceutical distributor · 12 depots',
    solutionKey: 'modernize',
    tabLabel: 'Pharma distributor',
    problem:
      'The distribution system still did its job — but nothing could connect to it, and month-end close ate three days of manual work.',
    beforeLead: 'A .NET desktop app on one server.',
    before:
      'Depot stock arrived as emailed spreadsheets. Any new report meant a change request to a developer who had already left.',
    diagnosis:
      'The logic was sound, tested by a decade of use. The problem was the closed architecture: no API, reports hard-coded into the client, direct database access the only way in.',
    whatChanged:
      'The logic stayed. We wrapped it in a documented API, moved reporting onto a read replica, and swapped the emailed spreadsheet for a browser form.',
    howBuilt:
      'An API layer over the existing database, a read replica for reporting, depot web forms, then a staged cutover — one depot at a time, across a quarter. No big-bang migration.',
    results: [
      {
        value: '3 days → same day',
        label: 'month-end close, because reporting no longer waits for the desktop client',
      },
      {
        value: '12 depots',
        label: 'reporting stock through one form instead of twelve spreadsheets',
      },
      { value: 'Zero rewrites', label: 'of the business logic that already worked' },
    ],
    lesson:
      'Depot managers trusted their spreadsheet. Adoption only moved once we let them keep it running alongside the form for the first month.',
    isIllustrative: true,
    featured: true,
  },
  {
    slug: 'freight-forwarder-single-entry',
    title: 'The same shipment, entered once instead of three times.',
    clientName: null,
    context: 'Freight forwarder · ~60 shipments a week',
    solutionKey: 'automate',
    tabLabel: 'Freight forwarder',
    problem:
      'Every shipment was keyed into the operations system, the accounting package and a customer tracking sheet — by three different people.',
    beforeLead: '~60 shipments a week, each entered three times.',
    before:
      'Discrepancies surfaced at invoicing, when the numbers disagreed and someone had to work out which was right.',
    diagnosis:
      'Three systems, each treated as the source of truth by the team that used it. No agreement about which one actually was.',
    whatChanged:
      'Operations became the system of record. Accounting and the customer view now follow it automatically, within minutes of entry.',
    howBuilt:
      'Workflow automation over the existing APIs, with a reconciliation report that flags anything that did not sync. Six weeks.',
    results: [
      { value: '3 entries → 1', label: 'per shipment, with the other two following automatically' },
      { value: 'Invoicing disputes', label: 'now surface within minutes rather than at month-end' },
      {
        value: 'No new software',
        label: 'for the team to learn — the systems they had, connected',
      },
    ],
    lesson:
      'We automated the sync before agreeing who owned the data. That argument should have happened in week one, not week four.',
    isIllustrative: true,
    featured: false,
  },
  {
    slug: 'engineering-firm-tender-knowledge',
    title: 'Ten years of tender documents, finally answerable.',
    clientName: null,
    context: 'Engineering firm · ~9,000 documents',
    solutionKey: 'ai',
    tabLabel: 'Engineering firm',
    problem:
      'Writing a new tender meant finding how they had answered something similar before. That knowledge existed, across a decade of files nobody could search.',
    beforeLead: 'Roughly 9,000 documents. No usable search.',
    before:
      'Two senior engineers were the search index. When either was busy, tender responses waited.',
    diagnosis:
      'A retrieval problem, not a writing problem. The answers existed and were good; they were simply unreachable.',
    whatChanged:
      'An internal assistant that answers from their own documents and cites the file and page it came from, so an engineer can verify before using it.',
    howBuilt:
      'Retrieval over the document archive, access scoped to the existing permissions, and citations on every answer. No document leaves their infrastructure.',
    results: [
      { value: 'Cited answers', label: 'every response links to the source file and page' },
      { value: 'Two engineers', label: 'no longer the only route to a decade of prior work' },
      { value: 'On their servers', label: 'no client document sent to a third-party model' },
    ],
    lesson:
      'The first version answered confidently from outdated documents. Filtering by document status mattered more than any model choice.',
    isIllustrative: true,
    featured: false,
  },
  {
    slug: 'b2b-software-continuous-improvement',
    title: 'After launch, the system kept getting better.',
    clientName: null,
    context: 'B2B software company · 14 months',
    solutionKey: 'care',
    tabLabel: 'B2B software',
    problem:
      'The platform launched well, then stopped changing. Small improvements queued behind whoever had time, which was nobody.',
    beforeLead: 'Fourteen months without a meaningful change.',
    before:
      'Dependencies drifted out of date, and two outages were reported by customers before anyone internal noticed.',
    diagnosis:
      'No cadence and no owner. Improvement had no budget line, so it never competed successfully against new work.',
    whatChanged:
      'A monthly cycle: monitoring, patching, a short list of improvements, and a written review the client receives whether or not anything broke.',
    howBuilt:
      'Uptime and error monitoring, a scheduled dependency and security cadence, and a visible roadmap reviewed each month.',
    results: [
      {
        value: 'Monitoring first',
        label: 'failures now surface internally before a customer reports one',
      },
      {
        value: 'Monthly',
        label: 'improvements ship on a cadence instead of waiting for a project',
      },
      { value: 'A written review', label: 'every month, whether or not anything went wrong' },
    ],
    lesson:
      'The first review was too technical to be read. It became useful when it led with what changed for their customers.',
    isIllustrative: true,
    featured: false,
  },
];

export const FEATURED_CASES = CASE_STUDIES.filter((c) => c.featured);

export function caseStudiesFor(solutionKey: SolutionKey): CaseStudy[] {
  return CASE_STUDIES.filter((c) => c.solutionKey === solutionKey);
}
