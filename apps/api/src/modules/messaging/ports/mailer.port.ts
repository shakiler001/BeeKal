/**
 * The mail port.
 *
 * Domain and application code send mail through this interface and never know
 * which provider is behind it. Swapping SMTP for SES is one adapter file and
 * one env var — which is the no-lock-in rule made mechanical (docs/00 s3).
 */

export interface MailAddress {
  email: string;
  name?: string | undefined;
}

export interface OutgoingMail {
  to: MailAddress;
  subject: string;
  /** Plain text is required; HTML is optional. */
  text: string;
  html?: string | undefined;
  replyTo?: string | undefined;
  /** For threading and deduplication. */
  idempotencyKey?: string | undefined;
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export interface Mailer {
  send(mail: OutgoingMail): Promise<SendResult>;
}

export const MAILER = Symbol('Mailer');
