import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CaseStudyUpsertSchema,
  FaqUpsertSchema,
  PublishActionSchema,
  SolutionUpsertSchema,
} from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import {
  canTransition,
  requiresPublishPermission,
  validateCaseStudyClaim,
  validateForPublish,
  type ContentStatus,
} from '../domain/publishing.js';
import { Audit } from '../../../shared/audit/index.js';
import { CurrentUser, RequirePermission, type AuthUser } from '../../../shared/auth/index.js';
import { defined } from '../../../shared/prisma-input.js';

/**
 * Content CRUD for the admin. Consistent across every type: list, read, create,
 * update, delete, and a separate status transition that carries its own
 * permission.
 */
@Controller('content')
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- Solutions ----------------

  @Get('solutions')
  @RequirePermission('solution:read')
  async listSolutions() {
    return this.prisma.solution.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  @Patch('solutions/:id')
  @RequirePermission('solution:update')
  @Audit('solution.updated', 'Solution')
  async updateSolution(@Param('id') id: string, @Body() body: unknown) {
    const parsed = SolutionUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    await this.assertExists('solution', id);
    return this.prisma.solution.update({ where: { id }, data: defined(parsed.data) });
  }

  @Patch('solutions/:id/status')
  @RequirePermission('solution:update')
  @Audit('solution.status_changed', 'Solution')
  async publishSolution(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const next = this.parseStatus(body);
    const current = await this.prisma.solution.findUnique({
      where: { id },
      select: { status: true, seoTitle: true, seoDescription: true },
    });
    if (!current) throw notFound();

    this.assertTransition(current.status, next, user, 'solution:publish');

    if (next === 'PUBLISHED') {
      const validation = validateForPublish({
        seoTitle: current.seoTitle,
        seoDescription: current.seoDescription,
      });
      if (!validation.ok) throw publishBlocked(validation.problems);
    }

    return this.prisma.solution.update({
      where: { id },
      data: { status: next, publishedAt: next === 'PUBLISHED' ? new Date() : null },
    });
  }

  // ---------------- Case studies ----------------

  @Get('case-studies')
  @RequirePermission('case_study:read')
  async listCaseStudies() {
    return this.prisma.caseStudy.findMany({
      where: { deletedAt: null },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    });
  }

  @Post('case-studies')
  @RequirePermission('case_study:create')
  @Audit('case_study.created', 'CaseStudy')
  async createCaseStudy(@Body() body: unknown) {
    const parsed = CaseStudyUpsertSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    this.assertCaseStudyClaim(parsed.data);

    return this.prisma.caseStudy.create({
      data: {
        ...parsed.data,
        clientName: parsed.data.clientName ?? null,
        approvedAt: parsed.data.clientApproved ? new Date() : null,
      },
    });
  }

  @Patch('case-studies/:id')
  @RequirePermission('case_study:update')
  @Audit('case_study.updated', 'CaseStudy')
  async updateCaseStudy(@Param('id') id: string, @Body() body: unknown) {
    const parsed = CaseStudyUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    const existing = await this.prisma.caseStudy.findUnique({
      where: { id },
      select: { isIllustrative: true, clientApproved: true, clientName: true },
    });
    if (!existing) throw notFound();

    // Check the merged state, not just the patch: flipping isIllustrative
    // without supplying a client name must still be caught.
    this.assertCaseStudyClaim({ ...existing, ...parsed.data });

    const approving = parsed.data.clientApproved === true && !existing.clientApproved;

    return this.prisma.caseStudy.update({
      where: { id },
      data: {
        ...defined(parsed.data),
        ...(parsed.data.clientName !== undefined
          ? { clientName: parsed.data.clientName ?? null }
          : {}),
        ...(approving ? { approvedAt: new Date() } : {}),
      },
    });
  }

  @Patch('case-studies/:id/status')
  @RequirePermission('case_study:update')
  @Audit('case_study.status_changed', 'CaseStudy')
  async publishCaseStudy(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const next = this.parseStatus(body);
    const current = await this.prisma.caseStudy.findUnique({
      where: { id },
      select: { status: true, isIllustrative: true, clientApproved: true, clientName: true },
    });
    if (!current) throw notFound();

    this.assertTransition(current.status, next, user, 'case_study:publish');

    if (next === 'PUBLISHED') this.assertCaseStudyClaim(current);

    return this.prisma.caseStudy.update({
      where: { id },
      data: { status: next, publishedAt: next === 'PUBLISHED' ? new Date() : null },
    });
  }

  @Delete('case-studies/:id')
  @RequirePermission('case_study:delete')
  @Audit('case_study.deleted', 'CaseStudy')
  async deleteCaseStudy(@Param('id') id: string) {
    await this.assertExists('caseStudy', id);
    return this.prisma.caseStudy.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
      select: { id: true },
    });
  }

  // ---------------- FAQs ----------------

  @Get('faqs')
  @RequirePermission('faq:read')
  async listFaqs() {
    return this.prisma.faq.findMany({
      where: { deletedAt: null },
      orderBy: [{ group: 'asc' }, { order: 'asc' }],
    });
  }

  @Post('faqs')
  @RequirePermission('faq:create')
  @Audit('faq.created', 'Faq')
  async createFaq(@Body() body: unknown) {
    const parsed = FaqUpsertSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);
    return this.prisma.faq.create({ data: { ...parsed.data, status: 'PUBLISHED' } });
  }

  @Patch('faqs/:id')
  @RequirePermission('faq:update')
  @Audit('faq.updated', 'Faq')
  async updateFaq(@Param('id') id: string, @Body() body: unknown) {
    const parsed = FaqUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);
    await this.assertExists('faq', id);
    return this.prisma.faq.update({ where: { id }, data: defined(parsed.data) });
  }

  @Delete('faqs/:id')
  @RequirePermission('faq:delete')
  @Audit('faq.deleted', 'Faq')
  async deleteFaq(@Param('id') id: string) {
    await this.assertExists('faq', id);
    return this.prisma.faq.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  // ---------------- helpers ----------------

  private parseStatus(body: unknown): ContentStatus {
    const parsed = PublishActionSchema.safeParse(body);
    if (!parsed.success) throw validationError('Choose a valid status');
    return parsed.data.status;
  }

  private assertTransition(
    from: ContentStatus,
    to: ContentStatus,
    user: AuthUser,
    publishPermission: string,
  ): void {
    const verdict = canTransition(from, to);
    if (!verdict.allowed) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: verdict.reason });
    }

    // This is the separation that makes Delivery and Editor different roles.
    if (requiresPublishPermission(to) && !user.can(publishPermission)) {
      throw new ForbiddenException({
        code: 'CANNOT_PUBLISH',
        message: 'You can edit this, but publishing needs an editor',
      });
    }
  }

  private assertCaseStudyClaim(input: {
    isIllustrative?: boolean | undefined;
    clientApproved?: boolean | undefined;
    clientName?: string | null | undefined;
  }): void {
    const result = validateCaseStudyClaim({
      isIllustrative: input.isIllustrative ?? true,
      clientApproved: input.clientApproved ?? false,
      clientName: input.clientName,
    });
    if (!result.ok) {
      throw new BadRequestException({
        code: 'UNVERIFIED_CLIENT_CLAIM',
        message: result.problems.join('. '),
      });
    }
  }

  private async assertExists(model: 'solution' | 'caseStudy' | 'faq', id: string): Promise<void> {
    const found =
      model === 'solution'
        ? await this.prisma.solution.findUnique({ where: { id }, select: { id: true } })
        : model === 'caseStudy'
          ? await this.prisma.caseStudy.findUnique({ where: { id }, select: { id: true } })
          : await this.prisma.faq.findUnique({ where: { id }, select: { id: true } });

    if (!found) throw notFound();
  }
}

function validationError(message: string | undefined) {
  return new BadRequestException({
    code: 'VALIDATION_FAILED',
    message: message ?? 'Check the details',
  });
}

function notFound() {
  return new NotFoundException({ code: 'NOT_FOUND', message: 'That does not exist' });
}

function publishBlocked(problems: string[]) {
  return new BadRequestException({ code: 'NOT_PUBLISHABLE', message: problems.join('. ') });
}
