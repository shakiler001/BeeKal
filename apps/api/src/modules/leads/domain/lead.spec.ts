import { describe, expect, it } from 'vitest';
import { createLead, deriveSource, LeadInvariantError } from './lead.js';
import { isHot, scoreLead } from './lead-score.js';
import { checkSpam } from './spam-check.js';

const base = {
  name: 'Rahim Uddin',
  email: 'rahim@factory.com.bd',
  intent: 'assessment',
  problemArea: 'disconnected-systems',
  message:
    'We run four systems and none of them agree. Our merchandisers spend every morning rebuilding the same order status report by hand, and last week we quoted two buyers different ship dates for one order.',
  contactConsent: true,
  marketingConsent: false,
  attribution: {},
};

describe('createLead', () => {
  it('refuses to construct a lead without contact consent', () => {
    // The invariant lives in the aggregate, so no caller can bypass it.
    expect(() => createLead({ ...base, contactConsent: false })).toThrow(LeadInvariantError);
  });

  it('scores the lead at construction', () => {
    const lead = createLead(base);
    expect(lead.score).toBeGreaterThan(0);
    expect(lead.scoreReasons.length).toBeGreaterThan(0);
  });

  it('keeps marketing consent separate from contact consent', () => {
    // The privacy copy promises no mailing list. Replying must never enrol.
    const lead = createLead(base);
    expect(lead.contactConsent).toBe(true);
    expect(lead.marketingConsent).toBe(false);
  });
});

describe('scoreLead', () => {
  it('explains every point it awards', () => {
    const { score, reasons } = scoreLead({ ...base, company: 'Acme Ltd' });
    const summed = reasons.reduce((s, r) => s + r.points, 0);
    // An unexplainable score gets ignored by whoever it was meant to help.
    expect(summed).toBe(score);
  });

  it('ranks a specific, detailed enquiry above a vague one', () => {
    const detailed = scoreLead(base);
    const vague = scoreLead({ ...base, message: 'interested' });
    expect(detailed.score).toBeGreaterThan(vague.score);
  });

  it('ranks an assessment request above a general chat', () => {
    const assessment = scoreLead({ ...base, intent: 'assessment' });
    const talk = scoreLead({ ...base, intent: 'talk' });
    expect(assessment.score).toBeGreaterThan(talk.score);
  });

  it('gives a work domain more weight than a consumer one', () => {
    const work = scoreLead(base);
    const personal = scoreLead({ ...base, email: 'rahim@gmail.com' });
    expect(work.score).toBeGreaterThan(personal.score);
  });

  it('does not disqualify a consumer domain outright', () => {
    // Plenty of founders use a personal address.
    const personal = scoreLead({ ...base, email: 'rahim@gmail.com' });
    expect(personal.score).toBeGreaterThan(0);
  });

  it('ranks "not sure yet" below a defined problem', () => {
    const defined = scoreLead(base);
    const unsure = scoreLead({ ...base, problemArea: 'not-sure' });
    expect(defined.score).toBeGreaterThan(unsure.score);
  });

  it('never exceeds 100', () => {
    const maxed = scoreLead({
      ...base,
      company: 'Acme Ltd',
      utmSource: 'referral',
      message: 'word '.repeat(200),
    });
    expect(maxed.score).toBeLessThanOrEqual(100);
  });

  it('flags a strong enquiry as hot', () => {
    const { score } = scoreLead({ ...base, company: 'Acme Ltd' });
    expect(isHot(score)).toBe(true);
  });
});

describe('deriveSource', () => {
  it('reads campaign traffic from utm_source', () => {
    expect(deriveSource({ utmSource: 'linkedin', utmMedium: 'cpc' })).toBe('campaign');
  });

  it('distinguishes a referral medium', () => {
    expect(deriveSource({ utmSource: 'partner', utmMedium: 'referral' })).toBe('referral');
  });

  it('treats a bare referrer as organic', () => {
    expect(deriveSource({ referrer: 'https://google.com' })).toBe('organic');
  });

  it('falls back to direct', () => {
    expect(deriveSource({})).toBe('direct');
  });
});

describe('checkSpam', () => {
  const now = 1_000_000;

  it('rejects a filled honeypot', () => {
    const verdict = checkSpam({ website: 'http://spam.example', now });
    expect(verdict).toEqual({ spam: true, reason: 'honeypot' });
  });

  it('rejects an implausibly fast submission', () => {
    const verdict = checkSpam({ renderedAt: now - 500, now });
    expect(verdict).toEqual({ spam: true, reason: 'too-fast' });
  });

  it('accepts a normal fill time', () => {
    const verdict = checkSpam({ renderedAt: now - 30_000, now });
    expect(verdict.spam).toBe(false);
  });

  it('accepts a form left open for a long time', () => {
    // A stale timestamp means a distracted person, not an attack.
    const verdict = checkSpam({ renderedAt: now - 86_400_000, now });
    expect(verdict.spam).toBe(false);
  });

  it('accepts a submission with no timing information at all', () => {
    // JavaScript may be partly blocked. Failing closed would reject real people.
    const verdict = checkSpam({ now });
    expect(verdict.spam).toBe(false);
  });

  it('ignores an empty honeypot', () => {
    expect(checkSpam({ website: '', now }).spam).toBe(false);
    expect(checkSpam({ website: '   ', now }).spam).toBe(false);
  });
});
