/**
 * The publishing workflow, shared by every content type.
 *
 * DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED, with per-type validation hooks.
 * The transition to PUBLISHED requires the :publish permission, which is why
 * Editor and Delivery are separate roles: Delivery writes a case study, Editor
 * publishes it (docs/04 section 4).
 */

export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

const ALLOWED: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['IN_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  IN_REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DRAFT', 'ARCHIVED'],
  // Archived content returns as a draft. Republishing straight from the
  // archive would skip whatever review caused it to be archived.
  ARCHIVED: ['DRAFT'],
};

export type TransitionVerdict = { allowed: true } | { allowed: false; reason: string };

export function canTransition(from: ContentStatus, to: ContentStatus): TransitionVerdict {
  if (from === to) return { allowed: true };

  if (!ALLOWED[from].includes(to)) {
    return {
      allowed: false,
      reason: `Content cannot go from ${from.toLowerCase()} straight to ${to.toLowerCase()}`,
    };
  }
  return { allowed: true };
}

/** Publishing is the transition that needs the :publish permission. */
export function requiresPublishPermission(to: ContentStatus): boolean {
  return to === 'PUBLISHED';
}

export interface PublishValidationInput {
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
  /** Media ids referenced by this record that have no alt text. */
  mediaMissingAlt?: string[] | undefined;
}

export type ValidationResult = { ok: true } | { ok: false; problems: string[] };

/**
 * What must be true before anything goes live.
 *
 * Alt text is enforced here rather than left to a reviewer's memory: an image
 * without it cannot go live (docs/04 section 2.3).
 */
export function validateForPublish(input: PublishValidationInput): ValidationResult {
  const problems: string[] = [];

  if (input.seoTitle !== undefined && input.seoTitle.trim().length === 0) {
    problems.push('Add an SEO title before publishing');
  }
  if (input.seoDescription !== undefined && input.seoDescription.trim().length === 0) {
    problems.push('Add an SEO description before publishing');
  }
  if (input.mediaMissingAlt && input.mediaMissingAlt.length > 0) {
    problems.push(
      `${input.mediaMissingAlt.length} image${input.mediaMissingAlt.length === 1 ? '' : 's'} still need alt text`,
    );
  }

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

/**
 * Mirrors the database check constraint so the UI can explain the rule before
 * Postgres rejects the write rather than after.
 */
export function validateCaseStudyClaim(input: {
  isIllustrative: boolean;
  clientApproved: boolean;
  clientName: string | null | undefined;
}): ValidationResult {
  if (input.isIllustrative) return { ok: true };

  const problems: string[] = [];
  if (!input.clientName?.trim()) problems.push('A real case study needs a named client');
  if (!input.clientApproved) problems.push('A real case study needs written client approval');

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}
