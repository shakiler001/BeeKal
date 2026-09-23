import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { env } from '../../../config/env.js';
import type { Mailer, OutgoingMail, SendResult } from '../ports/mailer.port.js';

/**
 * SMTP adapter, via Nodemailer.
 *
 * SMTP rather than a provider SDK on purpose: every mail service speaks it, so
 * moving between them is a credential change rather than a code change. A
 * provider SDK in domain code is exactly the lock-in the plan rules out
 * (docs/00 section 3).
 */
@Injectable()
export class SmtpMailer implements Mailer, OnModuleDestroy {
  private readonly logger = new Logger(SmtpMailer.name);
  private transporter: Transporter | undefined;

  private get transport(): Transporter {
    if (!this.transporter) {
      const config = env();
      this.transporter = createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT ?? 587,
        // Port 465 is implicit TLS; everything else upgrades with STARTTLS.
        secure: (config.SMTP_PORT ?? 587) === 465,
        ...(config.SMTP_USER
          ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS ?? '' } }
          : {}),
        pool: true,
        maxConnections: 3,
      });
    }
    return this.transporter;
  }

  async send(mail: OutgoingMail): Promise<SendResult> {
    const config = env();
    try {
      const info = await this.transport.sendMail({
        from: config.MAIL_FROM,
        to: mail.to.name ? `${mail.to.name} <${mail.to.email}>` : mail.to.email,
        subject: mail.subject,
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
        replyTo: mail.replyTo ?? config.MAIL_REPLY_TO ?? config.MAIL_FROM,
      });

      return { ok: true, id: info.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      // Logged, not thrown: the outbox relay decides whether to retry, and a
      // thrown error here would lose that decision.
      this.logger.error(`SMTP send failed: ${message}`);
      return { ok: false, error: message };
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.transporter?.close();
    await Promise.resolve();
  }
}
