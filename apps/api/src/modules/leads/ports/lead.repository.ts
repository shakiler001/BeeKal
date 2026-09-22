import type { Lead } from '../domain/lead.js';

/**
 * What the leads module needs from storage, expressed in domain terms.
 * The application layer depends on this, never on Prisma.
 */
export interface SavedLead {
  id: string;
  name: string;
  email: string;
  score: number;
}

export interface LeadRepository {
  /**
   * Persists the lead and its outbox event in ONE transaction. Without the
   * outbox, a crash between "lead saved" and "email queued" silently loses a
   * customer (docs/03 section 2).
   */
  save(lead: Lead, source: string): Promise<SavedLead>;
}

export const LEAD_REPOSITORY = Symbol('LeadRepository');
