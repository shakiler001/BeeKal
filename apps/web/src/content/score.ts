/**
 * The Business System Maturity Score.
 *
 * Nine dimensions, five levels. Ported from the demo, with the anchor wording
 * for each level added so a slider position means something specific rather
 * than a vague 1-to-5.
 *
 * These move to `score_dimensions` and `score_levels` in Phase 3 because the
 * model WILL change — a scoring model hard-coded in a component is a scoring
 * model nobody improves (docs/04 section 2.4).
 */

export interface ScoreDimension {
  key: string;
  label: string;
  question: string;
  /** Wording for levels 1 through 5, in order. */
  anchors: [string, string, string, string, string];
  weight: number;
}

export const SCORE_DIMENSIONS: ScoreDimension[] = [
  {
    key: 'process',
    label: 'Process',
    question: 'Are your core processes written down and followed?',
    anchors: [
      'Nothing written down; everyone does it their own way',
      'Some written, mostly out of date',
      'Documented and broadly followed',
      'Documented, followed and reviewed',
      'Measured, and improved on a cadence',
    ],
    weight: 1,
  },
  {
    key: 'technology',
    label: 'Technology',
    question: 'Is your software current and fit for the work?',
    anchors: [
      'Mostly spreadsheets and email',
      'Some software, ageing and awkward',
      'Fit for purpose, kept current',
      'Fit, current and well integrated',
      'Actively evolved against the business plan',
    ],
    weight: 1,
  },
  {
    key: 'data',
    label: 'Data',
    question: 'Is your data accurate and in one place?',
    anchors: [
      'Scattered; two people get two answers',
      'Several copies, reconciled by hand',
      'One main source, some duplication',
      'Single source of truth, trusted',
      'Trusted, governed and measured for quality',
    ],
    weight: 1.2,
  },
  {
    key: 'automation',
    label: 'Automation',
    question: 'How much routine work runs without a person?',
    anchors: [
      'Everything is manual',
      'A few scheduled reports',
      'Common tasks automated',
      'Most routine work runs itself',
      'Exceptions only reach a person',
    ],
    weight: 1.2,
  },
  {
    key: 'ai',
    label: 'AI',
    question: 'Is AI used anywhere it removes real work?',
    anchors: [
      'Not at all',
      'Experiments, nothing in production',
      'One use case live',
      'Several, measured against what they replaced',
      'Embedded where it genuinely helps, and nowhere else',
    ],
    weight: 0.8,
  },
  {
    key: 'security',
    label: 'Security',
    question: 'Are access, backups and updates managed?',
    anchors: [
      'Shared logins, no backups worth the name',
      'Backups exist, never tested',
      'Access controlled, backups tested',
      'Controlled, tested, patched on a schedule',
      'Reviewed regularly, with an incident plan',
    ],
    weight: 1.1,
  },
  {
    key: 'integration',
    label: 'Integration',
    question: 'Do your systems share data on their own?',
    anchors: [
      'Nothing connects; people copy between systems',
      'One or two ad-hoc exports',
      'Key systems connected',
      'Most systems connected reliably',
      'Integration is designed, documented and monitored',
    ],
    weight: 1.2,
  },
  {
    key: 'reporting',
    label: 'Reporting',
    question: 'Do reports arrive without being built by hand?',
    anchors: [
      'Rebuilt by hand every time',
      'Templates that still need assembly',
      'Scheduled and delivered automatically',
      'Self-service for the people who need it',
      'Decisions are routinely made from them',
    ],
    weight: 1,
  },
  {
    key: 'scalability',
    label: 'Scalability',
    question: 'Could this cope with twice the volume?',
    anchors: [
      'No — it barely copes now',
      'Only by hiring proportionally',
      'Probably, with some strain',
      'Yes, without proportional hiring',
      'Yes, and we know exactly where the next limit is',
    ],
    weight: 1,
  },
];

export interface ScoreLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  guidance: string;
}

export const SCORE_LEVELS: ScoreLevel[] = [
  {
    level: 1,
    name: 'Manual',
    description: 'The business runs on people remembering things, and on spreadsheets.',
    guidance:
      'The fastest wins here are usually not software at all — they are agreeing how the process should work, then writing it down. Automate after that, not before.',
  },
  {
    level: 2,
    name: 'Digital',
    description: 'Work happens in software, but each system is its own island.',
    guidance:
      'You have bought good products. What is missing is the layer that makes them one system. Start where the same data is entered twice.',
  },
  {
    level: 3,
    name: 'Connected',
    description: 'Your main systems exchange data, and most people trust the numbers.',
    guidance:
      'The remaining cost is in the gaps — the approvals, the exceptions, the month-end assembly. That is where automation pays next.',
  },
  {
    level: 4,
    name: 'Automated',
    description: 'Routine work runs without a person. People handle the exceptions.',
    guidance:
      'You are in the minority. The next gain is usually intelligence: making what the company already knows reachable, and letting judgement scale.',
  },
  {
    level: 5,
    name: 'Intelligent',
    description: 'Systems, data and intelligence work together, and improve on a cadence.',
    guidance:
      'At this level the risk is drift rather than absence. Keep the improvement cadence and the measurement honest.',
  },
];

export const MAX_SCORE = 5;

/** Weighted mean, rounded to the nearest level. */
export function calculateLevel(answers: Record<string, number>): {
  total: number;
  level: 1 | 2 | 3 | 4 | 5;
  weakest: ScoreDimension[];
} {
  const answered = SCORE_DIMENSIONS.filter((d) => answers[d.key] !== undefined);
  const weightSum = answered.reduce((sum, d) => sum + d.weight, 0);
  const weighted = answered.reduce((sum, d) => sum + (answers[d.key] ?? 0) * d.weight, 0);
  const total = weightSum > 0 ? weighted / weightSum : 0;

  const level = Math.max(1, Math.min(5, Math.round(total))) as 1 | 2 | 3 | 4 | 5;

  const weakest = [...answered]
    .sort((a, b) => (answers[a.key] ?? 0) - (answers[b.key] ?? 0))
    .slice(0, 2);

  return { total, level, weakest };
}

/** At least six of nine, so a result is not drawn from two answers. */
export const MIN_ANSWERS = 6;
