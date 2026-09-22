import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma.service.js';
import type { Lead } from '../domain/lead.js';
import type { LeadRepository, SavedLead } from '../ports/lead.repository.js';

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(lead: Lead, source: string): Promise<SavedLead> {
    // One transaction: the lead, the outbox event and the audit entry commit
    // together or not at all. A lead saved without its notification event is a
    // customer nobody replies to.
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: toLeadRow(lead, source),
        select: { id: true, name: true, email: true, score: true },
      });

      await tx.outboxEvent.create({
        data: {
          type: 'lead.submitted',
          payload: {
            leadId: created.id,
            email: created.email,
            name: created.name,
            score: created.score,
            intent: lead.intent,
            problemArea: lead.problemArea,
            // The relay decides what to send; it must not have to re-read the
            // lead to know whether a sequence is permitted.
            marketingConsent: lead.marketingConsent,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'lead.submitted',
          entityType: 'Lead',
          entityId: created.id,
          after: { score: created.score, source },
        },
      });

      return created;
    });
  }
}

/**
 * Maps the domain aggregate onto the storage row.
 *
 * `scoreReasons` is serialised explicitly rather than cast: Prisma's JSON input
 * type will not accept an interface without an index signature, and a blanket
 * `as any` here would hide a real shape mismatch later.
 */
function toLeadRow(lead: Lead, source: string): Prisma.LeadCreateInput {
  const scoreReasons: Prisma.InputJsonValue = lead.scoreReasons.map((r) => ({
    factor: r.factor,
    points: r.points,
    detail: r.detail,
  }));

  return {
    name: lead.name,
    email: lead.email,
    company: lead.company ?? null,
    phone: lead.phone ?? null,
    intent: lead.intent,
    problemArea: lead.problemArea,
    message: lead.message,
    contactConsent: lead.contactConsent,
    marketingConsent: lead.marketingConsent,
    source,
    utmSource: lead.attribution.utmSource ?? null,
    utmMedium: lead.attribution.utmMedium ?? null,
    utmCampaign: lead.attribution.utmCampaign ?? null,
    utmContent: lead.attribution.utmContent ?? null,
    utmTerm: lead.attribution.utmTerm ?? null,
    referrer: lead.attribution.referrer ?? null,
    landingPath: lead.attribution.landingPath ?? null,
    score: lead.score,
    scoreReasons,
  };
}
