/**
 * Email bodies.
 *
 * Plain text, deliberately. These two emails are a founder's inbox and a
 * personal acknowledgement — an HTML template with a logo and a gradient would
 * make the reply look like marketing, which is exactly what the site spends
 * its whole homepage promising it is not.
 *
 * Pure functions with no I/O, so they are trivially testable and can be
 * previewed without sending anything.
 */

export interface LeadSummary {
  leadId: string;
  email: string;
  name: string;
  score: number;
  intent: string;
  problemArea: string;
  marketingConsent: boolean;
}

const PROBLEM_LABELS: Record<string, string> = {
  'manual-work': 'Too much manual work',
  'disconnected-systems': 'Systems that do not connect',
  'legacy-software': 'Legacy software',
  'ai-opportunity': 'AI: where could it help?',
  'new-product': 'A new product or idea',
  'not-sure': 'Not sure yet',
};

/** To the founder. Leads with the decision, not with pleasantries. */
export function renderLeadNotification(lead: LeadSummary): string {
  const hot = lead.score >= 70;

  return [
    hot
      ? `${lead.name} scored ${lead.score}. Worth answering today.`
      : `${lead.name} scored ${lead.score}.`,
    '',
    `Wants:    ${lead.intent === 'assessment' ? 'An assessment' : 'To describe a problem'}`,
    `Area:     ${PROBLEM_LABELS[lead.problemArea] ?? lead.problemArea}`,
    `Email:    ${lead.email}`,
    '',
    `Read it:  /admin/leads/${lead.leadId}`,
    '',
    lead.marketingConsent
      ? 'They also opted in to occasional articles.'
      : 'They agreed to a reply only — do not add them to a sequence.',
  ].join('\n');
}

/**
 * To the person who wrote in. Says what happens next and nothing else: no
 * brochure, no "meanwhile, follow us on LinkedIn".
 */
export function renderLeadAcknowledgement(lead: LeadSummary): string {
  const firstName = lead.name.trim().split(/\s+/)[0] ?? lead.name;

  return [
    `${firstName},`,
    '',
    'Thanks — your message reached us.',
    '',
    lead.intent === 'assessment'
      ? 'Shakil will reply within one working day with the questions he would ask first, and whether an assessment is the right next step for you. If it is not, he will say so.'
      : 'Shakil will reply within one working day with the questions he would ask first. If what you need is smaller than a project, he will tell you that too.',
    '',
    'No automated sequence follows this. The next email you get from us is a person replying.',
    '',
    '—',
    'Beekal · Dhaka, Bangladesh',
    'Better systems. Better work. Better tomorrow.',
  ].join('\n');
}

export interface ScoreReportSummary {
  shareCode: string;
  email: string;
  level: number;
  levelName: string;
  weakestLabels: string[];
  appUrl: string;
}

/**
 * The maturity score report.
 *
 * Leads with the two weak dimensions rather than the level, because "you are
 * Level 2" is a label and "your data and your integrations are what is holding
 * you there" is something a COO can act on.
 */
export function renderScoreReport(report: ScoreReportSummary): string {
  const weak = report.weakestLabels;

  const holdingYouBack =
    weak.length >= 2
      ? `The two things holding you there are ${weak[0]} and ${weak[1]}.`
      : weak.length === 1
        ? `The main thing holding you there is ${weak[0]}.`
        : null;

  return [
    `You scored Level ${report.level} — ${report.levelName}.`,
    '',
    holdingYouBack,
    holdingYouBack ? '' : null,
    'Your full result, including the chart and a page on each weak dimension:',
    `${report.appUrl}/score/r/${report.shareCode}`,
    '',
    'That link works for anyone you send it to, so you can forward it to whoever',
    'needs to see it without them retaking the questions.',
    '',
    'Worth saying plainly: this is a self-assessment. It reflects how you answered,',
    'not what we found. The Business System Assessment is the one where we check.',
    `${report.appUrl}/assessment`,
    '',
    '—',
    'Beekal · Dhaka, Bangladesh',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}
