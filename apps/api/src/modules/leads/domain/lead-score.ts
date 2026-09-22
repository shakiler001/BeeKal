/**
 * Lead scoring. Pure functions over plain data — no framework, no database.
 *
 * An unexplainable score gets ignored by whoever it was meant to help
 * (docs/04 section 2.4), so this returns the reasons alongside the number.
 * In Phase 4 the weights move to the database and this becomes a Strategy;
 * the shape of the output is designed for that already.
 */

export interface ScoreInput {
  problemArea: string;
  message: string;
  company?: string | undefined;
  email: string;
  intent: string;
  utmSource?: string | undefined;
}

export interface ScoreReason {
  factor: string;
  points: number;
  detail: string;
}

export interface ScoredLead {
  score: number;
  reasons: ScoreReason[];
}

/**
 * Domains that indicate a personal address rather than a business one. A
 * personal address is not disqualifying — plenty of founders use one — it just
 * carries less signal than a company domain.
 */
const CONSUMER_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'live.com',
  'aol.com',
]);

/** Problem areas that map to a defined offer score higher than "not sure". */
const AREA_POINTS: Record<string, number> = {
  'disconnected-systems': 25,
  'legacy-software': 25,
  'manual-work': 20,
  'new-product': 15,
  'ai-opportunity': 12,
  'not-sure': 5,
};

export function scoreLead(input: ScoreInput): ScoredLead {
  const reasons: ScoreReason[] = [];

  const areaPoints = AREA_POINTS[input.problemArea] ?? 5;
  reasons.push({
    factor: 'problemArea',
    points: areaPoints,
    detail: `Problem area "${input.problemArea}"`,
  });

  // Intent: asking for the paid diagnostic is a stronger signal than a chat.
  const intentPoints = input.intent === 'assessment' ? 20 : 8;
  reasons.push({
    factor: 'intent',
    points: intentPoints,
    detail:
      input.intent === 'assessment' ? 'Asked for an assessment' : 'Wants to describe a problem',
  });

  // Specificity. Someone who writes three sentences about their actual
  // operation is a different prospect from someone who writes "interested".
  const words = input.message.trim().split(/\s+/).length;
  const messagePoints = words >= 60 ? 25 : words >= 30 ? 18 : words >= 12 ? 10 : 3;
  reasons.push({
    factor: 'messageDetail',
    points: messagePoints,
    detail: `${words} words describing the problem`,
  });

  const domain = input.email.split('@')[1]?.toLowerCase() ?? '';
  const workEmail = domain.length > 0 && !CONSUMER_DOMAINS.has(domain);
  reasons.push({
    factor: 'emailDomain',
    points: workEmail ? 15 : 5,
    detail: workEmail ? `Work domain (${domain})` : 'Personal email domain',
  });

  const companyPoints = input.company?.trim() ? 10 : 0;
  if (companyPoints > 0) {
    reasons.push({ factor: 'company', points: companyPoints, detail: 'Named their company' });
  }

  const referralPoints = input.utmSource === 'referral' ? 10 : 0;
  if (referralPoints > 0) {
    reasons.push({ factor: 'source', points: referralPoints, detail: 'Arrived via referral' });
  }

  const score = reasons.reduce((sum, r) => sum + r.points, 0);

  return { score: Math.min(100, score), reasons };
}

/** Above this, the founder is notified immediately rather than in a digest. */
export const HOT_LEAD_THRESHOLD = 70;

export function isHot(score: number): boolean {
  return score >= HOT_LEAD_THRESHOLD;
}
