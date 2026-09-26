import { describe, expect, it } from 'vitest';
import { sanitizeAuditResult } from './audit.interceptor.js';

describe('audit result redaction', () => {
  it('does not persist an invitation link or token', () => {
    expect(
      sanitizeAuditResult({
        id: 'user-id',
        setupUrl: 'https://example.com/admin/setup?token=secret',
        setupToken: 'secret',
      }),
    ).toEqual({ id: 'user-id' });
  });
});
