import { z } from 'zod';
import { ContentStatusSchema, PaginationSchema, text } from '../shared/index.js';
import { LeadStageSchema } from '../leads/index.js';

/** Contracts for the admin panel. */

// ---------- Roles ----------

export const ScopeSchema = z.enum(['ALL', 'OWN', 'ASSIGNED']);
export type ScopeValue = z.infer<typeof ScopeSchema>;

export const RoleGrantSchema = z.object({
  permissionKey: z.string(),
  scope: ScopeSchema.default('ALL'),
});

export const RoleUpsertSchema = z.object({
  name: text(2, 60),
  description: text(0, 400).optional(),
  grants: z.array(RoleGrantSchema),
});
export type RoleUpsert = z.infer<typeof RoleUpsertSchema>;

export const RoleSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  isOwner: z.boolean(),
  userCount: z.number().int(),
  grants: z.array(RoleGrantSchema),
});
export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.object({
  key: z.string(),
  resource: z.string(),
  action: z.string(),
  group: z.string(),
  label: z.string(),
});
export type Permission = z.infer<typeof PermissionSchema>;

// ---------- Users ----------

export const UserStatusSchema = z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']);

export const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  status: UserStatusSchema,
  lastLoginAt: z.string().nullable(),
  mfaEnabled: z.boolean(),
  roles: z.array(z.object({ id: z.string(), key: z.string(), name: z.string() })),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const UserUpdateSchema = z.object({
  name: text(2, 120).optional(),
  roleIds: z.array(z.string().uuid()).min(1).optional(),
  status: UserStatusSchema.optional(),
});
export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// ---------- Leads ----------

export const LeadListQuerySchema = PaginationSchema.extend({
  stage: LeadStageSchema.optional(),
  assignedToId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['newest', 'score']).default('score'),
});
export type LeadListQuery = z.infer<typeof LeadListQuerySchema>;

export const AdminLeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: z.string().nullable(),
  intent: z.string(),
  problemArea: z.string(),
  message: z.string(),
  score: z.number().int(),
  scoreReasons: z
    .array(z.object({ factor: z.string(), points: z.number(), detail: z.string() }))
    .nullable(),
  stage: LeadStageSchema,
  source: z.string().nullable(),
  utmSource: z.string().nullable(),
  marketingConsent: z.boolean(),
  assignedToId: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminLead = z.infer<typeof AdminLeadSchema>;

export const LeadUpdateSchema = z.object({
  stage: LeadStageSchema.optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});
export type LeadUpdate = z.infer<typeof LeadUpdateSchema>;

// ---------- Content ----------

export const ContentListQuerySchema = PaginationSchema.extend({
  status: ContentStatusSchema.optional(),
  search: z.string().max(200).optional(),
});
export type ContentListQuery = z.infer<typeof ContentListQuerySchema>;

export const SolutionUpsertSchema = z.object({
  key: z.string().min(1).max(40),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words separated by hyphens'),
  name: text(2, 80),
  cardHeadline: text(4, 160),
  cardBody: text(4, 400),
  pageHeadline: text(4, 200),
  pageIntro: text(4, 1200),
  signs: z.array(text(4, 300)),
  whatWeDo: z.array(text(4, 300)),
  before: z.array(text(2, 200)),
  after: z.array(text(2, 200)),
  seoTitle: text(4, 70),
  seoDescription: text(20, 165),
  order: z.number().int().min(0).default(0),
});
export type SolutionUpsert = z.infer<typeof SolutionUpsertSchema>;

/**
 * Problem pages: the landing pages cold traffic arrives on.
 *
 * `solutionKey` is a plain string rather than an enum of the five that
 * shipped, because categories are rows now and a problem may point at one
 * added last week.
 */
export const ProblemUpsertSchema = z.object({
  key: z.string().min(1).max(40),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words separated by hyphens'),
  cardHeadline: text(4, 160),
  cardAnswer: text(2, 80),
  cardBody: text(4, 400),
  pageHeadline: text(4, 200),
  pageIntro: text(4, 1200),
  diagnostic: z.array(text(4, 300)),
  causes: text(10, 1200),
  fixLooksLike: z.array(text(4, 300)),
  solutionKey: z.string().min(1).max(40),
  seoTitle: text(4, 70),
  seoDescription: text(20, 165),
  order: z.number().int().min(0).default(0),
});
export type ProblemUpsert = z.infer<typeof ProblemUpsertSchema>;

export const CaseStudyUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words separated by hyphens'),
  title: text(4, 160),
  clientName: text(1, 120).nullable().optional(),
  context: text(4, 200),
  solutionKey: z.string().min(1).max(40),
  tabLabel: text(2, 60),
  problem: text(10, 800),
  beforeLead: text(4, 200),
  before: text(10, 800),
  diagnosis: text(10, 800),
  whatChanged: text(10, 1000),
  howBuilt: text(10, 1000),
  results: z.array(z.object({ value: text(1, 60), label: text(4, 200) })).min(1),
  /** Mandatory. It is the most credible element on the site. */
  lesson: text(10, 600),
  isIllustrative: z.boolean().default(true),
  clientApproved: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});
export type CaseStudyUpsert = z.infer<typeof CaseStudyUpsertSchema>;

/**
 * Mirrors the database check constraint, so the UI can explain the rule before
 * Postgres rejects the write rather than after.
 */
export const CaseStudyPublishableSchema = CaseStudyUpsertSchema.refine(
  (c) => c.isIllustrative || (c.clientApproved && !!c.clientName),
  {
    message:
      'A real case study needs a named client and written approval. Leave it marked as an example scenario until then.',
    path: ['clientApproved'],
  },
);

export const FaqUpsertSchema = z.object({
  question: text(4, 200),
  answer: text(10, 1200),
  group: z.string().min(1).max(40).default('assessment'),
  order: z.number().int().min(0).default(0),
});
export type FaqUpsert = z.infer<typeof FaqUpsertSchema>;

export const SettingUpdateSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
export type SettingUpdate = z.infer<typeof SettingUpdateSchema>;

export const PublishActionSchema = z.object({
  status: ContentStatusSchema,
});
export type PublishAction = z.infer<typeof PublishActionSchema>;
