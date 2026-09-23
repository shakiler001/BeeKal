import { z } from 'zod';
import { EmailSchema, UtmSchema } from '../shared/index.js';

/**
 * The Business System Maturity Score.
 *
 * The result is free and requires no email — the page promises exactly that,
 * and gating it would break a stated promise (docs/00 section 6). The email is
 * asked for AFTER the result, in exchange for a PDF that is genuinely more
 * than what was already shown.
 */

export const SCORE_DIMENSION_KEYS = [
  'process',
  'technology',
  'data',
  'automation',
  'ai',
  'security',
  'integration',
  'reporting',
  'scalability',
] as const;

export type ScoreDimensionKey = (typeof SCORE_DIMENSION_KEYS)[number];

export const ScoreAnswerSchema = z.number().int().min(1).max(5);

export const ScoreSubmitSchema = z
  .object({
    /** Partial answers are valid; at least six are required to score. */
    answers: z.record(z.enum(SCORE_DIMENSION_KEYS), ScoreAnswerSchema),
  })
  .merge(UtmSchema)
  .refine((v) => Object.keys(v.answers).length >= 6, {
    message: 'Answer at least six of the nine to get a result',
    path: ['answers'],
  });

export type ScoreSubmit = z.infer<typeof ScoreSubmitSchema>;

export const ScoreResultSchema = z.object({
  shareCode: z.string(),
  level: z.number().int().min(1).max(5),
  levelName: z.string(),
  totalScore: z.number(),
  weakest: z.array(z.string()),
  answers: z.record(z.string(), z.number()),
  completedAt: z.string(),
});
export type ScoreResult = z.infer<typeof ScoreResultSchema>;

/** The optional ask, after the result is already on screen. */
export const ScoreReportRequestSchema = z.object({
  shareCode: z.string().min(4).max(24),
  email: EmailSchema,
  /**
   * Separate from any reply consent, and unticked by default. The privacy copy
   * promises no mailing list, so this is the only flag a sequence may check.
   */
  marketingConsent: z.boolean().default(false),
});
export type ScoreReportRequest = z.infer<typeof ScoreReportRequestSchema>;
