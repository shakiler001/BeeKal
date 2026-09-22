import { describe, expect, it } from 'vitest';
import { LeadCreateSchema } from './index.js';

const valid = {
  name: 'Rahim Uddin',
  email: '  Rahim@Example.COM ',
  intent: 'assessment' as const,
  problemArea: 'manual-work' as const,
  message: 'Four people spend every morning rebuilding the same report.',
  contactConsent: true as const,
};

describe('LeadCreateSchema', () => {
  it('normalises the email so the database never holds two spellings', () => {
    const parsed = LeadCreateSchema.parse(valid);
    expect(parsed.email).toBe('rahim@example.com');
  });

  it('defaults marketing consent to false', () => {
    // The privacy copy promises no mailing list. Silence must mean no.
    const parsed = LeadCreateSchema.parse(valid);
    expect(parsed.marketingConsent).toBe(false);
  });

  it('rejects a submission without contact consent', () => {
    const result = LeadCreateSchema.safeParse({ ...valid, contactConsent: false });
    expect(result.success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    const result = LeadCreateSchema.safeParse({ ...valid, website: 'http://spam.example' });
    expect(result.success).toBe(false);
  });

  it('rejects a message too short to be a real problem description', () => {
    const result = LeadCreateSchema.safeParse({ ...valid, message: 'hi' });
    expect(result.success).toBe(false);
  });

  it('keeps UTM attribution when present', () => {
    const parsed = LeadCreateSchema.parse({ ...valid, utmSource: 'linkedin' });
    expect(parsed.utmSource).toBe('linkedin');
  });
});
