import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { LeadListQuerySchema, LeadUpdateSchema, type AdminLead } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import { Audit } from '../../../shared/audit/index.js';
import { CurrentUser, RequirePermission, type AuthUser } from '../../../shared/auth/index.js';

/**
 * The lead inbox — the founder's daily screen.
 *
 * Scope narrows the QUERY rather than filtering after the fact. A Sales user's
 * query never loads rows they cannot see, so there is nothing to leak in a
 * response or a log (docs/04 section 3).
 */
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('lead:read')
  async list(
    @Query() query: unknown,
    @CurrentUser() user: AuthUser,
  ): Promise<{ items: AdminLead[]; nextCursor: string | null; total: number }> {
    const parsed = LeadListQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Invalid filters' });
    }
    const { cursor, limit, stage, assignedToId, search, sort } = parsed.data;

    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...this.scopeFilter(user),
      ...(stage ? { stage } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy:
          sort === 'score' ? [{ score: 'desc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }],
      }),
      this.prisma.lead.count({ where }),
    ]);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: items.map(toAdminLead),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
      total,
    };
  }

  @Get(':id')
  @RequirePermission('lead:read')
  async get(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<AdminLead> {
    const lead = await this.prisma.lead.findFirst({
      // The scope filter is part of the lookup, so an out-of-scope id reads as
      // "not found" rather than "forbidden" — which also avoids confirming
      // that the record exists.
      where: { id, deletedAt: null, ...this.scopeFilter(user) },
    });
    if (!lead) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lead not found' });
    return toAdminLead(lead);
  }

  @Patch(':id')
  @RequirePermission('lead:update')
  @Audit('lead.updated', 'Lead')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ): Promise<AdminLead> {
    const parsed = LeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Invalid change' });
    }

    const existing = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null, ...this.scopeFilter(user, 'lead:update') },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lead not found' });

    // Reassigning a lead away from yourself while holding only ASSIGNED scope
    // would hand it to someone else and hide it from you — allowed, but it is
    // the one case worth being explicit about.
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(parsed.data.stage ? { stage: parsed.data.stage } : {}),
        ...(parsed.data.assignedToId !== undefined
          ? { assignedToId: parsed.data.assignedToId }
          : {}),
      },
    });

    return toAdminLead(updated);
  }

  /**
   * Turns the user's scope into a query predicate. ALL adds nothing; ASSIGNED
   * restricts to their own assignments.
   */
  private scopeFilter(user: AuthUser, permission = 'lead:read'): Prisma.LeadWhereInput {
    const scope = user.scopeFor(permission);
    if (scope === 'ALL') return {};
    if (scope === 'OWN' || scope === 'ASSIGNED') return { assignedToId: user.id };
    // No scope means no permission, and the guard already rejected that. This
    // is a belt-and-braces default that returns nothing rather than everything.
    return { id: '__none__' };
  }
}

type LeadRow = Prisma.LeadGetPayload<Record<string, never>>;

function toAdminLead(lead: LeadRow): AdminLead {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    intent: lead.intent,
    problemArea: lead.problemArea,
    message: lead.message,
    score: lead.score,
    scoreReasons: lead.scoreReasons as AdminLead['scoreReasons'],
    stage: lead.stage,
    source: lead.source,
    utmSource: lead.utmSource,
    marketingConsent: lead.marketingConsent,
    assignedToId: lead.assignedToId,
    createdAt: lead.createdAt.toISOString(),
  };
}
