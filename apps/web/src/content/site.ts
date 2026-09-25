/**
 * Business settings and the Assessment offer.
 *
 * These become `settings` rows in Phase 3 so the founder can change the price
 * or the reply-time promise without a deploy (docs/03 section 7). A fact that
 * needs a deploy to correct is a fact that stays wrong.
 */

export interface SiteSettings {
  name: string;
  tagline: string;
  promise: string;
  positioning: string;
  email: string;
  /** Empty hides every WhatsApp link. Format: 8801XXXXXXXXX */
  whatsapp: string;
  location: string;
  locationLong: string;
  replyTime: string;
  founderName: string;
  founderRole: string;
  legalEntity: string;
  registrationNumber: string;
}

export const SITE: SiteSettings = {
  name: 'Beekal',
  tagline: 'Better Tomorrow.',
  promise: 'Better systems. Better work. Better tomorrow.',
  positioning: 'We build the business behind the business.',
  email: 'shakil@beekal.com',
  /** Empty hides every WhatsApp link. Format: 8801XXXXXXXXX */
  whatsapp: '',
  location: 'Dhaka, Bangladesh',
  locationLong: 'Dhaka, Bangladesh. We work on-site and remotely.',
  replyTime: 'within one working day',
  founderName: 'Shakil Mahmud',
  founderRole: 'Founder',
  /** TODO: add once registered — raises trust with larger buyers. */
  legalEntity: '',
  registrationNumber: '',
};

export interface AssessmentOffer {
  name: string;
  promise: string;
  lede: string;
  duration: string;
  clientHours: string;
  /** Empty renders "Fixed, agreed first". */
  priceRange: string;
  documentCount: number;
  examines: readonly string[];
  deliverables: ReadonlyArray<{ name: string; answers: string }>;
  riskReversal: readonly string[];
}

export const ASSESSMENT: AssessmentOffer = {
  name: 'Business System Assessment',
  promise: 'See what to fix first, before you spend on building.',
  lede: 'The Business System Assessment finds what is slowing the business down and puts it in priority order.',
  duration: '2 to 3 weeks',
  clientHours: 'About 6 hours',
  /** Empty renders "Fixed, agreed first". Publish a range so buyers self-qualify. */
  priceRange: '',
  documentCount: 11,

  /** What we examine — thirteen areas, nothing assumed. */
  examines: [
    'Business processes',
    'People and responsibilities',
    'Existing software',
    'Data flow',
    'Manual work',
    'Reporting',
    'Integrations',
    'Technical debt',
    'User experience',
    'Automation opportunities',
    'AI opportunities',
    'Scalability',
    'Security',
  ],

  /**
   * The eleven deliverables, each paired with the fear it answers.
   * Same eleven items as the demo — reframed so each one sells (docs/01 s3.2).
   */
  deliverables: [
    {
      name: 'Current-state process map',
      answers: 'We do not actually know how our own process works',
    },
    { name: 'Current-state system map', answers: 'Nobody can list every system we run' },
    { name: 'Problem register', answers: 'Everyone describes the problem differently' },
    { name: 'Bottleneck analysis', answers: 'We do not know where the time goes' },
    { name: 'Automation opportunity map', answers: 'We do not know what could be automated' },
    { name: 'AI opportunity map', answers: 'We know AI matters but not where' },
    { name: 'Technology assessment', answers: 'Is our current software salvageable?' },
    { name: 'Recommended architecture', answers: 'What should we actually build?' },
    { name: 'Prioritized roadmap', answers: 'What do we do first?' },
    {
      name: 'Implementation phases',
      answers: 'How do we phase this without stopping the business?',
    },
    { name: 'Investment-level roadmap', answers: 'What will this cost?' },
  ],

  /** All three are already defensible. No money-back guarantee — see docs/01 s3.2. */
  riskReversal: [
    'No obligation to build with us afterwards.',
    'Every document is yours to keep — whoever ends up building the fix.',
    'If an assessment is not the right next step, we say so on the first call.',
  ],
};

/** The method. It appears on the site, in proposals and in delivery. */
export const METHOD = [
  {
    n: 1,
    name: 'Understand',
    body: 'The business, its users, processes and data. Where work slows down, and why.',
  },
  {
    n: 2,
    name: 'Simplify',
    body: 'Remove unnecessary steps and complexity before adding any technology.',
  },
  {
    n: 3,
    name: 'Systemize',
    body: 'Design one coherent system where people, processes and data work together.',
  },
  { n: 4, name: 'Automate', body: 'Let software and AI take the repetitive work off people.' },
  {
    n: 5,
    name: 'Improve',
    body: 'Measure the result, learn from it and keep improving after launch.',
  },
] as const;

/** The transformation, stated plainly. */
export const BEFORE_AFTER = {
  before: [
    'Processes live in Excel',
    'The same data typed in again and again',
    'Applications that do not talk to each other',
    'Reports built by hand, every time',
    'Information scattered across teams',
  ],
  after: [
    'One central system',
    'Workflows that run themselves',
    'Integrated applications',
    'Reports that arrive on their own',
    'One view of the whole business',
  ],
} as const;

/** The risks buyers actually fear, and what we do about each. */
export const RISKS = [
  { fear: 'Unclear requirements', answer: 'Structured discovery before anything is built.' },
  { fear: 'Scope creep', answer: 'Written scope, with a change process both sides can see.' },
  {
    fear: 'Project delays',
    answer: 'Milestones that deliver working software, not status reports.',
  },
  { fear: 'Unexpected cost', answer: 'Fixed price agreed first. No hourly billing.' },
  {
    fear: 'Poor communication',
    answer: 'One named person, reachable, replying within a working day.',
  },
  { fear: 'Vendor dependency', answer: 'You own the code, the accounts and the documentation.' },
  {
    fear: 'Abandoned software',
    answer: 'Continuous improvement is an option, not an afterthought.',
  },
  { fear: 'Security problems', answer: 'Access, backups and updates planned before launch.' },
  { fear: 'Bad implementation', answer: 'Testing and a deployment plan, agreed before cutover.' },
] as const;
