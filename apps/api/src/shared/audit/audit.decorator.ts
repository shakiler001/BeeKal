import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'beekal:audit';

export interface AuditMeta {
  /** Dotted, past tense: 'case_study.published'. */
  action: string;
  entityType: string;
}

/**
 * Marks a route for the audit log. Every mutating endpoint carries one.
 */
export const Audit = (action: string, entityType: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType } satisfies AuditMeta);
