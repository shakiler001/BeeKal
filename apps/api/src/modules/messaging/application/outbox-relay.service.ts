import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service.js';
import { MAILER, type Mailer } from '../ports/mailer.port.js';
import { env } from '../../../config/env.js';
import {
  renderLeadAcknowledgement,
  renderLeadNotification,
  renderScoreReport,
} from '../domain/templates.js';

/**
 * The transactional outbox relay.
 *
 * Events are written in the SAME transaction as the state change that caused
 * them, so a crash between "lead saved" and "email queued" cannot happen — the
 * row is either committed with its event or not at all. This worker then
 * delivers them (docs/03 section 2).
 *
 * Delivery is at-least-once, so every handler must be idempotent. It polls
 * rather than subscribing because the volume here is a handful of events a day
 * and polling has no moving parts to go wrong.
 */

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;

interface ScoreReportPayload {
  submissionId: string;
  shareCode: string;
  email: string;
  marketingConsent: boolean;
}

/** Emitted whenever a published content row changes. */
interface ContentChangedPayload {
  tag: string;
  reason: string;
}

interface LeadSubmittedPayload {
  leadId: string;
  email: string;
  name: string;
  score: number;
  intent: string;
  problemArea: string;
  marketingConsent: boolean;
}

@Injectable()
export class OutboxRelayService implements OnModuleInit {
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  onModuleInit(): void {
    // Skipped under test so specs do not race against a background poller.
    if (env().NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.drain(), POLL_INTERVAL_MS);
    // unref so the interval never holds the process open during shutdown.
    this.timer.unref();
    this.logger.log(`Outbox relay polling every ${POLL_INTERVAL_MS / 1000}s`);
  }

  /** Public so a test or an admin action can drain on demand. */
  async drain(): Promise<{ processed: number; failed: number }> {
    if (this.running) return { processed: 0, failed: 0 };
    this.running = true;

    let processed = 0;
    let failed = 0;

    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { processedAt: null, attempts: { lt: MAX_ATTEMPTS } },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      for (const event of events) {
        const ok = await this.handle(event.type, event.payload);

        if (ok) {
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { processedAt: new Date(), attempts: { increment: 1 } },
          });
          processed += 1;
        } else {
          const attempts = event.attempts + 1;
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { attempts, lastError: 'delivery failed' },
          });
          failed += 1;

          // Give up loudly rather than retrying forever in silence.
          if (attempts >= MAX_ATTEMPTS) {
            this.logger.error(
              `Outbox event ${event.id} (${event.type}) failed ${attempts} times and will not be retried`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Outbox drain failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.running = false;
    }

    if (processed > 0 || failed > 0) {
      this.logger.log(`Outbox: ${processed} delivered, ${failed} failed`);
    }
    return { processed, failed };
  }

  private async handle(type: string, payload: unknown): Promise<boolean> {
    switch (type) {
      case 'lead.submitted':
        return this.handleLeadSubmitted(payload as LeadSubmittedPayload);
      case 'score.report_requested':
        return this.handleScoreReport(payload as ScoreReportPayload);
      case 'content.changed':
        return this.handleContentChanged(payload as ContentChangedPayload);
      default:
        // An unknown type is a bug, not a transient failure. Mark it done so
        // it stops consuming retries, and say so.
        this.logger.warn(`No handler for outbox event type "${type}" — discarding`);
        return true;
    }
  }

  private async handleLeadSubmitted(payload: LeadSubmittedPayload): Promise<boolean> {
    const config = env();

    // Two emails, both sent regardless of marketing consent: one tells the
    // founder, the other confirms to the person that their message arrived.
    // Neither is marketing, so neither needs that permission.
    const notification = await this.mailer.send({
      to: { email: config.MAIL_REPLY_TO ?? config.MAIL_FROM },
      subject: `New ${payload.intent === 'assessment' ? 'assessment request' : 'enquiry'} — ${payload.name} (${payload.score})`,
      text: renderLeadNotification(payload),
      idempotencyKey: `lead-notify-${payload.leadId}`,
    });

    const acknowledgement = await this.mailer.send({
      to: { email: payload.email, name: payload.name },
      subject: 'We have your message — Beekal',
      text: renderLeadAcknowledgement(payload),
      replyTo: config.MAIL_REPLY_TO ?? config.MAIL_FROM,
      idempotencyKey: `lead-ack-${payload.leadId}`,
    });

    return notification.ok && acknowledgement.ok;
  }

  private async handleScoreReport(payload: ScoreReportPayload): Promise<boolean> {
    const submission = await this.prisma.scoreSubmission.findUnique({
      where: { id: payload.submissionId },
      select: { level: true, weakest: true, shareCode: true },
    });
    if (!submission) {
      // The submission is gone. Nothing to send and nothing to retry.
      this.logger.warn(`Score submission ${payload.submissionId} no longer exists`);
      return true;
    }

    const [level, dimensions] = await Promise.all([
      this.prisma.scoreLevel.findUnique({ where: { level: submission.level } }),
      this.prisma.scoreDimension.findMany({
        where: { key: { in: submission.weakest } },
        select: { key: true, label: true },
      }),
    ]);

    // Keep the order the scorer chose — weakest first — rather than whatever
    // order the database returned.
    const labelByKey = new Map(dimensions.map((d) => [d.key, d.label.toLowerCase()]));
    const weakestLabels = submission.weakest
      .map((key) => labelByKey.get(key))
      .filter((label): label is string => label !== undefined);

    const result = await this.mailer.send({
      to: { email: payload.email },
      subject: `Your business system score — Level ${submission.level}`,
      text: renderScoreReport({
        shareCode: submission.shareCode,
        email: payload.email,
        level: submission.level,
        levelName: level?.name ?? '',
        weakestLabels,
        appUrl: env().APP_URL,
      }),
      idempotencyKey: `score-report-${payload.submissionId}`,
    });

    return result.ok;
  }

  /**
   * Tells the web app to drop its cache for one content type.
   *
   * Rides the outbox rather than being called inline from the controller, for
   * the reason every other event does: the row and the intent to publish it
   * commit together, so a web app that is restarting when an editor hits
   * publish gets the message when it comes back rather than never.
   *
   * Idempotent by nature. Revalidating a tag twice costs one extra page
   * regeneration, which is why at-least-once is a fine guarantee here.
   */
  private async handleContentChanged(payload: ContentChangedPayload): Promise<boolean> {
    const config = env();
    const url = config.WEB_REVALIDATE_URL;
    const secret = config.REVALIDATE_SECRET;

    if (!url || !secret) {
      // Not an error. Unconfigured means the site refreshes on its own
      // backstop instead of immediately, which is a valid way to run a single
      // box. Said once per event so it is visible without being noise.
      this.logger.warn(
        `Content changed (${payload.tag}) but revalidation is not configured — ` +
          'the site will pick it up on its own schedule. ' +
          'Set WEB_REVALIDATE_URL and REVALIDATE_SECRET to make publishing immediate.',
      );
      return true;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
        body: JSON.stringify({ tag: payload.tag }),
        signal: AbortSignal.timeout(5_000),
      });

      if (!res.ok) {
        // A 400 means the tag is wrong, which retrying cannot fix, but the
        // retry budget is five and the log names the status either way.
        this.logger.warn(`Revalidate ${payload.tag} returned ${res.status}`);
        return false;
      }

      this.logger.log(`Revalidated ${payload.tag} (${payload.reason})`);
      return true;
    } catch (error) {
      this.logger.warn(
        `Revalidate ${payload.tag} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
