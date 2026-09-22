import { Inject, Injectable, Logger } from '@nestjs/common';
import { createLead, deriveSource, LeadInvariantError } from '../domain/lead.js';
import { checkSpam } from '../domain/spam-check.js';
import { isHot } from '../domain/lead-score.js';
import { LEAD_REPOSITORY, type LeadRepository } from '../ports/lead.repository.js';

export interface SubmitLeadCommand {
  name: string;
  email: string;
  company?: string | undefined;
  phone?: string | undefined;
  intent: string;
  problemArea: string;
  message: string;
  contactConsent: boolean;
  marketingConsent: boolean;
  website?: string | undefined;
  renderedAt?: number | undefined;
  utmSource?: string | undefined;
  utmMedium?: string | undefined;
  utmCampaign?: string | undefined;
  utmContent?: string | undefined;
  utmTerm?: string | undefined;
  referrer?: string | undefined;
  landingPath?: string | undefined;
}

export type SubmitLeadResult =
  | { ok: true; firstName: string; email: string }
  | { ok: false; error: 'spam' | 'invalid'; detail: string };

/**
 * One use case, one operation. Returns a Result rather than throwing for
 * expected failures, so the failure modes are visible in the type
 * (docs/03 section 3).
 */
@Injectable()
export class SubmitLeadUseCase {
  private readonly logger = new Logger(SubmitLeadUseCase.name);

  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: LeadRepository) {}

  async execute(command: SubmitLeadCommand): Promise<SubmitLeadResult> {
    const verdict = checkSpam({
      website: command.website,
      renderedAt: command.renderedAt,
      now: Date.now(),
    });

    if (verdict.spam) {
      // Logged, not surfaced. Telling a bot why it was rejected helps it.
      this.logger.warn(`Rejected submission: ${verdict.reason}`);
      return { ok: false, error: 'spam', detail: verdict.reason };
    }

    const attribution = {
      utmSource: command.utmSource,
      utmMedium: command.utmMedium,
      utmCampaign: command.utmCampaign,
      utmContent: command.utmContent,
      utmTerm: command.utmTerm,
      referrer: command.referrer,
      landingPath: command.landingPath,
    };

    try {
      const lead = createLead({
        name: command.name,
        email: command.email,
        company: command.company,
        phone: command.phone,
        intent: command.intent,
        problemArea: command.problemArea,
        message: command.message,
        contactConsent: command.contactConsent,
        marketingConsent: command.marketingConsent,
        attribution,
      });

      const saved = await this.leads.save(lead, deriveSource(attribution));

      this.logger.log(
        `Lead ${saved.id} scored ${saved.score}${isHot(saved.score) ? ' (hot)' : ''}`,
      );

      return {
        ok: true,
        firstName: saved.name.trim().split(/\s+/)[0] ?? saved.name,
        email: saved.email,
      };
    } catch (error) {
      if (error instanceof LeadInvariantError) {
        return { ok: false, error: 'invalid', detail: error.message };
      }
      throw error;
    }
  }
}
