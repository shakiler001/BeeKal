import { z } from 'zod';

/**
 * Primitives shared across every contract.
 *
 * One definition per concept. A field added to a form that the API rejects
 * should be a compile error, not a production bug (docs/03 section 3).
 */

export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

export const LocaleSchema = z.enum(['en']).default('en');
export type Locale = z.infer<typeof LocaleSchema>;

export const ContentStatusSchema = z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

/** Trimmed, non-empty, length-bounded text. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/**
 * Email, normalised to lowercase. Normalising in the schema rather than at each
 * call site means the database never ends up with two spellings of one address.
 */
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

/** Cursor pagination. Offset pagination drifts while rows are being inserted. */
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative(),
  });

/**
 * UTM attribution, captured on every public form so a lead's origin survives
 * into the CRM record (docs/01 section 5).
 */
export const UtmSchema = z.object({
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  referrer: z.string().max(2000).optional(),
  landingPath: z.string().max(500).optional(),
});
export type Utm = z.infer<typeof UtmSchema>;

/** The shape every API error takes, so clients can rely on one branch. */
export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.array(z.string())).optional(),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Cache tags for public content.
 *
 * Defined here because both ends need the same strings and neither owns them:
 * the API sends one when a row changes, the web app revalidates it. A tag that
 * exists on one side only is a cache that never clears, which presents as
 * "publishing does nothing" and is miserable to diagnose — so, like every other
 * payload that crosses the boundary, there is one definition.
 */
export const CONTENT_TAGS = {
  solutions: 'content:solutions',
  caseStudies: 'content:case-studies',
  problems: 'content:problems',
  faqs: 'content:faqs',
  settings: 'content:settings',
} as const;

export type ContentTag = (typeof CONTENT_TAGS)[keyof typeof CONTENT_TAGS];

const CONTENT_TAG_VALUES = new Set<string>(Object.values(CONTENT_TAGS));

export function isContentTag(value: unknown): value is ContentTag {
  return typeof value === 'string' && CONTENT_TAG_VALUES.has(value);
}
