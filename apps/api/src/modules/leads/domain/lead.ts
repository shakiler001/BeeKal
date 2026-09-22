import { type ScoreReason, scoreLead } from './lead-score.js';

/**
 * The Lead aggregate. Constructed through a factory so a Lead cannot exist in
 * an invalid state — the invariant lives here, not in whatever code happens to
 * create one.
 */

export interface LeadAttribution {
  source?: string | undefined;
  utmSource?: string | undefined;
  utmMedium?: string | undefined;
  utmCampaign?: string | undefined;
  utmContent?: string | undefined;
  utmTerm?: string | undefined;
  referrer?: string | undefined;
  landingPath?: string | undefined;
}

export interface NewLeadProps {
  name: string;
  email: string;
  company?: string | undefined;
  phone?: string | undefined;
  intent: string;
  problemArea: string;
  message: string;
  contactConsent: boolean;
  marketingConsent: boolean;
  attribution: LeadAttribution;
}

export interface Lead extends NewLeadProps {
  score: number;
  scoreReasons: ScoreReason[];
}

export class LeadInvariantError extends Error {}

export function createLead(props: NewLeadProps): Lead {
  // Contact consent is the one hard invariant: without it we have no basis to
  // hold the record or to reply, so the Lead must not exist.
  if (!props.contactConsent) {
    throw new LeadInvariantError('A lead cannot be created without contact consent');
  }

  const { score, reasons } = scoreLead({
    problemArea: props.problemArea,
    message: props.message,
    company: props.company,
    email: props.email,
    intent: props.intent,
    utmSource: props.attribution.utmSource,
  });

  return { ...props, score, scoreReasons: reasons };
}

/**
 * Where the lead came from, derived rather than trusted from the client.
 * UTM parameters mean paid or campaign traffic; a referrer from another site
 * means organic referral; nothing at all means direct.
 */
export function deriveSource(attribution: LeadAttribution): string {
  if (attribution.utmSource) return attribution.utmMedium === 'referral' ? 'referral' : 'campaign';
  if (attribution.referrer) return 'organic';
  return 'direct';
}
