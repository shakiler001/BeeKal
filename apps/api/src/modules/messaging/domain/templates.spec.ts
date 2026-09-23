import { describe, expect, it } from 'vitest';
import {
  renderLeadAcknowledgement,
  renderLeadNotification,
  type LeadSummary,
} from './templates.js';

const lead: LeadSummary = {
  leadId: 'lead_1',
  email: 'rahim@factory.com.bd',
  name: 'Rahim Uddin',
  score: 88,
  intent: 'assessment',
  problemArea: 'disconnected-systems',
  marketingConsent: false,
};

describe('renderLeadNotification', () => {
  it('leads with the decision, not with pleasantries', () => {
    const body = renderLeadNotification(lead);
    expect(body.split('\n')[0]).toContain('88');
    expect(body.split('\n')[0]).toContain('today');
  });

  it('drops the urgency line for a low score', () => {
    const body = renderLeadNotification({ ...lead, score: 30 });
    expect(body.split('\n')[0]).not.toContain('today');
  });

  it('warns explicitly when there is no marketing consent', () => {
    // The privacy promise depends on the founder seeing this before acting.
    expect(renderLeadNotification(lead)).toContain('do not add them to a sequence');
  });

  it('says so when they did opt in', () => {
    const body = renderLeadNotification({ ...lead, marketingConsent: true });
    expect(body).toContain('opted in');
    expect(body).not.toContain('do not add them');
  });

  it('links straight to the record', () => {
    expect(renderLeadNotification(lead)).toContain('/admin/leads/lead_1');
  });

  it('translates the problem area into the wording on the form', () => {
    expect(renderLeadNotification(lead)).toContain('Systems that do not connect');
  });
});

describe('renderLeadAcknowledgement', () => {
  it('uses the first name only', () => {
    expect(renderLeadAcknowledgement(lead).startsWith('Rahim,')).toBe(true);
  });

  it('promises a person, not a sequence', () => {
    const body = renderLeadAcknowledgement(lead);
    expect(body).toContain('No automated sequence follows this');
  });

  it('keeps the promise that we will say no when it is a no', () => {
    expect(renderLeadAcknowledgement(lead)).toContain('he will say so');
  });

  it('adjusts for someone who only wanted to describe a problem', () => {
    const body = renderLeadAcknowledgement({ ...lead, intent: 'talk' });
    expect(body).toContain('smaller than a project');
  });

  it('contains no marketing', () => {
    const body = renderLeadAcknowledgement(lead).toLowerCase();
    for (const phrase of ['follow us', 'newsletter', 'unsubscribe', 'meanwhile', 'check out']) {
      expect(body).not.toContain(phrase);
    }
  });
});
