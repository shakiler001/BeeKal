import { z } from 'zod';
import { EmailSchema, UtmSchema, text } from '../shared/index.js';

/**
 * The lead form is a qualification instrument, not a contact form
 * (docs/01 section 5). `problemArea` is the qualifying field: it routes the
 * lead, feeds the score, and personalises the founder's reply.
 */

export const LeadIntentSchema = z.enum(['assessment', 'talk']);
export type LeadIntent = z.infer<typeof LeadIntentSchema>;

/** Values match the six options already on the demo form, in its wording. */
export const ProblemAreaSchema = z.enum([
  'manual-work',
  'disconnected-systems',
  'legacy-software',
  'ai-opportunity',
  'new-product',
  'not-sure',
]);
export type ProblemArea = z.infer<typeof ProblemAreaSchema>;

export const PROBLEM_AREA_LABELS: Record<ProblemArea, string> = {
  'manual-work': 'Too much manual work',
  'disconnected-systems': 'Systems that do not connect',
  'legacy-software': 'Legacy software',
  'ai-opportunity': 'AI: where could it help?',
  'new-product': 'A new product or idea',
  'not-sure': 'Not sure yet',
};

export const LeadCreateSchema = z
  .object({
    name: text(2, 120),
    email: EmailSchema,
    company: text(1, 200).optional(),
    phone: text(5, 40).optional(),
    intent: LeadIntentSchema,
    problemArea: ProblemAreaSchema,
    message: text(10, 5000),

    /**
     * Two consents, deliberately separate. The privacy copy promises "we never
     * add you to a mailing list", so replying to someone must not enrol them in
     * a sequence. The sequence runner checks `marketingConsent`; nothing checks
     * `contactConsent` except the submission itself (docs/01 section 6.6).
     */
    contactConsent: z.literal(true, {
      errorMap: () => ({ message: 'We need your agreement before we can reply' }),
    }),
    marketingConsent: z.boolean().default(false),

    /** Anti-spam. Both are invisible to a real person (docs/05 section 4.1). */
    website: z.string().max(0).optional(), // honeypot: bots fill it, humans cannot see it
    renderedAt: z.number().int().positive().optional(), // timing check
  })
  .merge(UtmSchema);

export type LeadCreate = z.infer<typeof LeadCreateSchema>;

/**
 * What the public form is told after submitting. Deliberately thin: the lead id
 * is internal, and echoing it back gives an attacker a way to probe.
 */
export const LeadCreateResponseSchema = z.object({
  ok: z.literal(true),
  firstName: z.string(),
  email: z.string(),
});
export type LeadCreateResponse = z.infer<typeof LeadCreateResponseSchema>;

export const LeadStageSchema = z.enum([
  'NEW',
  'QUALIFYING',
  'QUALIFIED',
  'ASSESSMENT_PROPOSED',
  'ASSESSMENT_BOOKED',
  'ASSESSMENT_DELIVERED',
  'PROJECT_PROPOSED',
  'WON',
  'LOST',
  'NURTURE',
  'DISQUALIFIED',
]);
export type LeadStage = z.infer<typeof LeadStageSchema>;
