import { Global, Module } from '@nestjs/common';
import { OutboxRelayService } from './application/outbox-relay.service.js';
import { MAILER } from './ports/mailer.port.js';
import { ConsoleMailer } from './infrastructure/console.mailer.js';
import { SmtpMailer } from './infrastructure/smtp.mailer.js';
import { env } from '../../config/env.js';

/**
 * Binds the mail port to whichever adapter MAIL_DRIVER names.
 *
 * This factory is the only place in the codebase that knows a mail provider
 * exists. Everything else depends on the port.
 */
@Global()
@Module({
  providers: [
    ConsoleMailer,
    SmtpMailer,
    {
      provide: MAILER,
      inject: [ConsoleMailer, SmtpMailer],
      useFactory: (console: ConsoleMailer, smtp: SmtpMailer) =>
        env().MAIL_DRIVER === 'smtp' ? smtp : console,
    },
    OutboxRelayService,
  ],
  exports: [MAILER, OutboxRelayService],
})
export class MessagingModule {}
