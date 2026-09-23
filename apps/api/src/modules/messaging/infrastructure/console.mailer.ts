import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Mailer, OutgoingMail, SendResult } from '../ports/mailer.port.js';

/**
 * Prints mail to the log instead of sending it. The correct default for local
 * development: no account needed, and nothing can escape to a real inbox by
 * accident while the templates are still being written.
 */
@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  send(mail: OutgoingMail): Promise<SendResult> {
    const id = randomUUID();
    this.logger.log(
      [
        '',
        '  ┌─ MAIL (console driver — not sent) ─────────────────',
        `  │ To:      ${mail.to.name ? `${mail.to.name} <${mail.to.email}>` : mail.to.email}`,
        `  │ Subject: ${mail.subject}`,
        mail.replyTo ? `  │ Reply-to: ${mail.replyTo}` : null,
        '  ├────────────────────────────────────────────────────',
        ...mail.text.split('\n').map((line) => `  │ ${line}`),
        '  └────────────────────────────────────────────────────',
        '',
      ]
        .filter((l) => l !== null)
        .join('\n'),
    );
    return Promise.resolve({ ok: true, id });
  }
}
