import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ScoreReportRequestSchema, ScoreSubmitSchema, type ScoreResult } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import { Public, RequirePermission } from '../../../shared/auth/index.js';
import { calculateScore, generateShareCode } from '../domain/scoring.js';

/**
 * The maturity score.
 *
 * Submitting requires no account and no email, exactly as the page promises.
 * Persisting it anyway gives two things the demo's version could not: a
 * shareable result, and an aggregate we can eventually publish ("the average
 * Dhaka manufacturer scores 2.3 on Integration").
 */
@Controller('score')
export class ScoreController {
  constructor(private readonly prisma: PrismaService) {}

  /** The questions and level copy, so the tool renders from the database. */
  @Public()
  @Get('config')
  async config() {
    const [dimensions, levels] = await Promise.all([
      this.prisma.scoreDimension.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.scoreLevel.findMany({ orderBy: { level: 'asc' } }),
    ]);
    return { dimensions, levels };
  }

  @Public()
  @Post()
  async submit(@Body() body: unknown): Promise<ScoreResult> {
    const parsed = ScoreSubmitSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check your answers',
      });
    }

    const dimensions = await this.prisma.scoreDimension.findMany({
      where: { active: true },
      select: { key: true, weight: true },
    });

    const answers = parsed.data.answers as Record<string, number>;
    const outcome = calculateScore(answers, dimensions);

    const level = await this.prisma.scoreLevel.findUnique({ where: { level: outcome.level } });

    const submission = await this.prisma.scoreSubmission.create({
      data: {
        shareCode: await this.uniqueShareCode(),
        answers,
        totalScore: outcome.totalScore,
        level: outcome.level,
        weakest: outcome.weakest,
        utmSource: parsed.data.utmSource ?? null,
        utmMedium: parsed.data.utmMedium ?? null,
        utmCampaign: parsed.data.utmCampaign ?? null,
        referrer: parsed.data.referrer ?? null,
      },
    });

    return {
      shareCode: submission.shareCode,
      level: outcome.level,
      levelName: level?.name ?? '',
      totalScore: outcome.totalScore,
      weakest: outcome.weakest,
      answers,
      completedAt: submission.completedAt.toISOString(),
    };
  }

  /** A shared result. Public because sharing it is the point. */
  @Public()
  @Get('r/:shareCode')
  async byShareCode(@Param('shareCode') shareCode: string): Promise<ScoreResult> {
    const submission = await this.prisma.scoreSubmission.findUnique({ where: { shareCode } });
    if (!submission) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'That result does not exist' });
    }

    const level = await this.prisma.scoreLevel.findUnique({ where: { level: submission.level } });

    return {
      shareCode: submission.shareCode,
      level: submission.level,
      levelName: level?.name ?? '',
      totalScore: submission.totalScore,
      weakest: submission.weakest,
      answers: submission.answers as Record<string, number>,
      completedAt: submission.completedAt.toISOString(),
    };
  }

  /**
   * The optional ask, after the result is already on screen. Give the value
   * first, then ask — gating it would contradict a promise on the page.
   */
  @Public()
  @Post('report')
  async requestReport(@Body() body: unknown): Promise<{ ok: true }> {
    const parsed = ScoreReportRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check your email address',
      });
    }

    const submission = await this.prisma.scoreSubmission.findUnique({
      where: { shareCode: parsed.data.shareCode },
      select: { id: true, email: true },
    });
    if (!submission) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'That result does not exist' });
    }

    // Idempotent: asking twice must not queue two emails.
    if (submission.email === parsed.data.email) return { ok: true };

    await this.prisma.$transaction([
      this.prisma.scoreSubmission.update({
        where: { id: submission.id },
        data: { email: parsed.data.email },
      }),
      this.prisma.outboxEvent.create({
        data: {
          type: 'score.report_requested',
          payload: {
            submissionId: submission.id,
            shareCode: parsed.data.shareCode,
            email: parsed.data.email,
            marketingConsent: parsed.data.marketingConsent,
          },
        },
      }),
    ]);

    return { ok: true };
  }

  /** Aggregate benchmarks. Admin-only until there is enough data to publish. */
  @Get('benchmarks')
  @RequirePermission('score_submission:read')
  async benchmarks() {
    const [total, byLevel] = await Promise.all([
      this.prisma.scoreSubmission.count(),
      this.prisma.scoreSubmission.groupBy({ by: ['level'], _count: true }),
    ]);
    return { total, byLevel };
  }

  private async uniqueShareCode(): Promise<string> {
    // Eight characters from a 31-letter alphabet is ~40 bits. Collisions are
    // vanishingly unlikely, but "unlikely" is not "impossible" at the unique
    // index, so retry rather than 500.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateShareCode();
      const existing = await this.prisma.scoreSubmission.findUnique({
        where: { shareCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    throw new Error('Could not generate a unique share code');
  }
}
