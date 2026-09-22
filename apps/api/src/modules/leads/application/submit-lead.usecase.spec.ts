import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmitLeadUseCase, type SubmitLeadCommand } from './submit-lead.usecase.js';
import type { Lead } from '../domain/lead.js';
import type { LeadRepository, SavedLead } from '../ports/lead.repository.js';

/**
 * The use case is tested against a fake repository, not a database. That is the
 * point of the port: the business rules are verifiable without Postgres, and
 * the test runs in milliseconds (docs/03 section 8).
 */
class FakeLeadRepository implements LeadRepository {
  readonly saved: Array<{ lead: Lead; source: string }> = [];

  save(lead: Lead, source: string): Promise<SavedLead> {
    this.saved.push({ lead, source });
    return Promise.resolve({
      id: `lead_${this.saved.length}`,
      name: lead.name,
      email: lead.email,
      score: lead.score,
    });
  }
}

const command: SubmitLeadCommand = {
  name: 'Rahim Uddin',
  email: 'rahim@factory.com.bd',
  intent: 'assessment',
  problemArea: 'disconnected-systems',
  message:
    'We run four systems and none of them agree. Our merchandisers spend every morning rebuilding the same report by hand.',
  contactConsent: true,
  marketingConsent: false,
};

describe('SubmitLeadUseCase', () => {
  let repo: FakeLeadRepository;
  let useCase: SubmitLeadUseCase;

  beforeEach(() => {
    repo = new FakeLeadRepository();
    useCase = new SubmitLeadUseCase(repo);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('saves a valid lead and returns the first name for the thank-you', async () => {
    const result = await useCase.execute(command);

    expect(result).toEqual({ ok: true, firstName: 'Rahim', email: 'rahim@factory.com.bd' });
    expect(repo.saved).toHaveLength(1);
  });

  it('scores the lead before saving it', async () => {
    await useCase.execute(command);
    expect(repo.saved[0]?.lead.score).toBeGreaterThan(0);
    expect(repo.saved[0]?.lead.scoreReasons.length).toBeGreaterThan(0);
  });

  it('derives the source from attribution rather than trusting the client', async () => {
    await useCase.execute({ ...command, utmSource: 'linkedin', utmMedium: 'cpc' });
    expect(repo.saved[0]?.source).toBe('campaign');
  });

  it('records a direct visit when there is no attribution at all', async () => {
    await useCase.execute(command);
    expect(repo.saved[0]?.source).toBe('direct');
  });

  it('drops a submission with a filled honeypot without saving anything', async () => {
    const result = await useCase.execute({ ...command, website: 'http://spam.example' });

    expect(result).toEqual({ ok: false, error: 'spam', detail: 'honeypot' });
    expect(repo.saved).toHaveLength(0);
  });

  it('drops an implausibly fast submission', async () => {
    const result = await useCase.execute({ ...command, renderedAt: Date.now() });

    expect(result.ok).toBe(false);
    expect(repo.saved).toHaveLength(0);
  });

  it('refuses a lead without contact consent', async () => {
    const result = await useCase.execute({ ...command, contactConsent: false });

    expect(result).toMatchObject({ ok: false, error: 'invalid' });
    expect(repo.saved).toHaveLength(0);
  });

  it('carries marketing consent through untouched', async () => {
    // The privacy promise depends on this flag reaching storage unchanged.
    await useCase.execute({ ...command, marketingConsent: true });
    expect(repo.saved[0]?.lead.marketingConsent).toBe(true);
  });

  it('never enrols someone who only consented to a reply', async () => {
    await useCase.execute(command);
    expect(repo.saved[0]?.lead.contactConsent).toBe(true);
    expect(repo.saved[0]?.lead.marketingConsent).toBe(false);
  });
});
