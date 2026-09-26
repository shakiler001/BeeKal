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
  ArticleUpsertSchema,
  CaseStudyUpsertSchema,
  CONTENT_TAGS,
  FaqUpsertSchema,
  ProblemUpsertSchema,
  PublishActionSchema,
  ResourceUpsertSchema,
  SolutionUpsertSchema,
  type ContentTag,
} from '@beekal/contracts';
import type { Prisma } from '@prisma/client';
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

  /**
   * Commits a content write and the intent to refresh the site together.
   *
   * The public site caches until it is told otherwise, so an edit that commits
   * without its revalidation is an edit nobody sees — indistinguishable, from
   * the editor's chair, from the save having failed. Writing both in one
   * transaction makes that impossible: either the row changed and the site will
   * be told, or neither happened (FLW-04).
   *
   * The relay delivers it afterwards and retries, so a web app that is
   * restarting at that moment is not a lost publish.
   */
  private async writeAndRevalidate<T>(
    tag: ContentTag,
    reason: string,
    write: Prisma.PrismaPromise<T>,
  ): Promise<T> {
    const [row] = await this.prisma.$transaction([
      write,
      this.prisma.outboxEvent.create({
        data: { type: 'content.changed', payload: { tag, reason } },
      }),
    ]);
    return row;
  }

  // ---------------- Solutions ----------------

  @Get('solutions')
  @RequirePermission('solution:read')
  async listSolutions() {
    return this.prisma.solution.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Creating a category.
   *
   * The permission existed from the start and the endpoint did not, which made
   * the five shipped categories a fixed set in practice while looking
   * configurable in the permission matrix.
   *
   * `key` is what case studies and problems reference, so it is immutable once
   * set — there is no update path for it — and unique. A new category starts as
   * a draft: it appears in the admin's category picker immediately, and on the
   * site only once published.
   */
  @Post('solutions')
  @RequirePermission('solution:create')
  @Audit('solution.created', 'Solution')
  async createSolution(@Body() body: unknown) {
    const parsed = SolutionUpsertSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    const clash = await this.prisma.solution.findFirst({
      where: { OR: [{ key: parsed.data.key }, { slug: parsed.data.slug }], deletedAt: null },
      select: { key: true, slug: true },
    });
    if (clash) {
      throw validationError(
        clash.key === parsed.data.key
          ? `A category already uses the key "${parsed.data.key}"`
          : `A category already uses the address "/solutions/${parsed.data.slug}"`,
      );
    }

    return this.writeAndRevalidate(
      CONTENT_TAGS.solutions,
      'solution created',
      this.prisma.solution.create({ data: parsed.data }),
    );
  }

  /**
   * Removing a category.
   *
   * Soft delete, and refused while case studies still point at it. A hard
   * delete would leave those rows naming a category that no longer exists —
   * the pages tolerate that, but silently orphaning someone's work is not a
   * thing a button should do without saying so.
   */
  @Delete('solutions/:id')
  @RequirePermission('solution:delete')
  @Audit('solution.deleted', 'Solution')
  async deleteSolution(@Param('id') id: string) {
    const solution = await this.prisma.solution.findUnique({
      where: { id },
      select: { key: true, deletedAt: true },
    });
    if (!solution || solution.deletedAt) throw notFound();

    const inUse = await this.prisma.caseStudy.count({
      where: { solutionKey: solution.key, deletedAt: null },
    });
    if (inUse > 0) {
      throw validationError(
        `${inUse} case ${inUse === 1 ? 'study is' : 'studies are'} filed under this category. ` +
          'Move them first, or unpublish the category instead of deleting it.',
      );
    }

    return this.writeAndRevalidate(
      CONTENT_TAGS.solutions,
      'solution deleted',
      this.prisma.solution.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'ARCHIVED' },
        select: { id: true },
      }),
    );
  }

  @Patch('solutions/:id')
  @RequirePermission('solution:update')
  @Audit('solution.updated', 'Solution')
  async updateSolution(@Param('id') id: string, @Body() body: unknown) {
    const parsed = SolutionUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    await this.assertExists('solution', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.solutions,
      'solution updated',
      this.prisma.solution.update({ where: { id }, data: defined(parsed.data) }),
    );
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

    return this.writeAndRevalidate(
      CONTENT_TAGS.solutions,
      `solution ${next.toLowerCase()}`,
      this.prisma.solution.update({
        where: { id },
        data: { status: next, publishedAt: next === 'PUBLISHED' ? new Date() : null },
      }),
    );
  }

  // ---------------- Problems ----------------

  /**
   * Problem pages had a table, a public endpoint and a full set of permissions,
   * and no way to write them. Same gap as the others, filled the same way.
   */
  @Get('problems')
  @RequirePermission('problem:read')
  async listProblems() {
    return this.prisma.problem.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  @Post('problems')
  @RequirePermission('problem:create')
  @Audit('problem.created', 'Problem')
  async createProblem(@Body() body: unknown) {
    const parsed = ProblemUpsertSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    const clash = await this.prisma.problem.findFirst({
      where: { OR: [{ key: parsed.data.key }, { slug: parsed.data.slug }], deletedAt: null },
      select: { key: true },
    });
    if (clash) throw validationError('A problem page already uses that key or address');

    return this.writeAndRevalidate(
      CONTENT_TAGS.problems,
      'problem created',
      this.prisma.problem.create({ data: parsed.data }),
    );
  }

  @Patch('problems/:id')
  @RequirePermission('problem:update')
  @Audit('problem.updated', 'Problem')
  async updateProblem(@Param('id') id: string, @Body() body: unknown) {
    const parsed = ProblemUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    await this.assertExists('problem', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.problems,
      'problem updated',
      this.prisma.problem.update({ where: { id }, data: defined(parsed.data) }),
    );
  }

  @Patch('problems/:id/status')
  @RequirePermission('problem:update')
  @Audit('problem.status_changed', 'Problem')
  async publishProblem(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const next = this.parseStatus(body);
    const current = await this.prisma.problem.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw notFound();

    this.assertTransition(current.status, next, user, 'problem:publish');

    return this.writeAndRevalidate(
      CONTENT_TAGS.problems,
      `problem ${next.toLowerCase()}`,
      this.prisma.problem.update({
        where: { id },
        data: { status: next, publishedAt: next === 'PUBLISHED' ? new Date() : null },
      }),
    );
  }

  @Delete('problems/:id')
  @RequirePermission('problem:delete')
  @Audit('problem.deleted', 'Problem')
  async deleteProblem(@Param('id') id: string) {
    await this.assertExists('problem', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.problems,
      'problem deleted',
      this.prisma.problem.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'ARCHIVED' },
        select: { id: true },
      }),
    );
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

    return this.writeAndRevalidate(
      CONTENT_TAGS.caseStudies,
      'case study created',
      this.prisma.caseStudy.create({
        data: {
          ...parsed.data,
          clientName: parsed.data.clientName ?? null,
          approvedAt: parsed.data.clientApproved ? new Date() : null,
        },
      }),
    );
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

    return this.writeAndRevalidate(
      CONTENT_TAGS.caseStudies,
      'case study updated',
      this.prisma.caseStudy.update({
        where: { id },
        data: {
          ...defined(parsed.data),
          ...(parsed.data.clientName !== undefined
            ? { clientName: parsed.data.clientName ?? null }
            : {}),
          ...(approving ? { approvedAt: new Date() } : {}),
        },
      }),
    );
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

    return this.writeAndRevalidate(
      CONTENT_TAGS.caseStudies,
      `case study ${next.toLowerCase()}`,
      this.prisma.caseStudy.update({
        where: { id },
        data: { status: next, publishedAt: next === 'PUBLISHED' ? new Date() : null },
      }),
    );
  }

  @Delete('case-studies/:id')
  @RequirePermission('case_study:delete')
  @Audit('case_study.deleted', 'CaseStudy')
  async deleteCaseStudy(@Param('id') id: string) {
    await this.assertExists('caseStudy', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.caseStudies,
      'case study deleted',
      this.prisma.caseStudy.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'ARCHIVED' },
        select: { id: true },
      }),
    );
  }

  // ---------------- Articles ----------------

  /**
   * Articles are the top of the funnel: the free material someone reads long
   * before they enquire. They had a table and nothing else, which is why
   * /insights has never been publishable without a deploy.
   *
   * `publishedAt` is set on the first publish and then left alone. It orders the
   * index and appears on the page, so republishing after a typo fix must not
   * move a year-old article back to the top.
   */
  @Get('articles')
  @RequirePermission('article:read')
  async listArticles() {
    return this.prisma.article.findMany({
      where: { deletedAt: null },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  @Post('articles')
  @RequirePermission('article:create')
  @Audit('article.created', 'Article')
  async createArticle(@Body() body: unknown) {
    const parsed = ArticleUpsertSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    const clash = await this.prisma.article.findFirst({
      where: { slug: parsed.data.slug, deletedAt: null },
      select: { id: true },
    });
    if (clash) throw validationError('An article already uses that address');

    return this.writeAndRevalidate(
      CONTENT_TAGS.articles,
      'article created',
      this.prisma.article.create({ data: parsed.data }),
    );
  }

  @Patch('articles/:id')
  @RequirePermission('article:update')
  @Audit('article.updated', 'Article')
  async updateArticle(@Param('id') id: string, @Body() body: unknown) {
    const parsed = ArticleUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    await this.assertExists('article', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.articles,
      'article updated',
      this.prisma.article.update({ where: { id }, data: defined(parsed.data) }),
    );
  }

  @Patch('articles/:id/status')
  @RequirePermission('article:update')
  @Audit('article.status_changed', 'Article')
  async publishArticle(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const next = this.parseStatus(body);
    const current = await this.prisma.article.findUnique({
      where: { id },
      select: { status: true, publishedAt: true },
    });
    if (!current) throw notFound();

    this.assertTransition(current.status, next, user, 'article:publish');

    return this.writeAndRevalidate(
      CONTENT_TAGS.articles,
      `article ${next.toLowerCase()}`,
      this.prisma.article.update({
        where: { id },
        data: {
          status: next,
          publishedAt:
            next === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt,
        },
      }),
    );
  }

  @Delete('articles/:id')
  @RequirePermission('article:delete')
  @Audit('article.deleted', 'Article')
  async deleteArticle(@Param('id') id: string) {
    await this.assertExists('article', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.articles,
      'article deleted',
      this.prisma.article.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'ARCHIVED' },
        select: { id: true },
      }),
    );
  }

  // ---------------- Resources ----------------

  @Get('resources')
  @RequirePermission('resource:read')
  async listResources() {
    return this.prisma.resource.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  @Post('resources')
  @RequirePermission('resource:create')
  @Audit('resource.created', 'Resource')
  async createResource(@Body() body: unknown) {
    const parsed = ResourceUpsertSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    const clash = await this.prisma.resource.findFirst({
      where: { slug: parsed.data.slug, deletedAt: null },
      select: { id: true },
    });
    if (clash) throw validationError('A resource already uses that address');

    return this.writeAndRevalidate(
      CONTENT_TAGS.resources,
      'resource created',
      this.prisma.resource.create({
        data: { ...parsed.data, fileUrl: parsed.data.fileUrl ?? null },
      }),
    );
  }

  @Patch('resources/:id')
  @RequirePermission('resource:update')
  @Audit('resource.updated', 'Resource')
  async updateResource(@Param('id') id: string, @Body() body: unknown) {
    const parsed = ResourceUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);

    await this.assertExists('resource', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.resources,
      'resource updated',
      this.prisma.resource.update({
        where: { id },
        data: {
          ...defined(parsed.data),
          ...(parsed.data.fileUrl !== undefined ? { fileUrl: parsed.data.fileUrl ?? null } : {}),
        },
      }),
    );
  }

  @Patch('resources/:id/status')
  @RequirePermission('resource:update')
  @Audit('resource.status_changed', 'Resource')
  async publishResource(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const next = this.parseStatus(body);
    const current = await this.prisma.resource.findUnique({
      where: { id },
      select: { status: true, fileUrl: true, deletedAt: true },
    });
    if (!current || current.deletedAt) throw notFound();

    if (next === 'PUBLISHED' && !current.fileUrl) {
      throw validationError('Add a file or tool link before publishing');
    }

    this.assertTransition(current.status, next, user, 'resource:publish');

    return this.writeAndRevalidate(
      CONTENT_TAGS.resources,
      `resource ${next.toLowerCase()}`,
      this.prisma.resource.update({
        where: { id },
        data: { status: next, publishedAt: next === 'PUBLISHED' ? new Date() : null },
      }),
    );
  }

  @Delete('resources/:id')
  @RequirePermission('resource:delete')
  @Audit('resource.deleted', 'Resource')
  async deleteResource(@Param('id') id: string) {
    await this.assertExists('resource', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.resources,
      'resource deleted',
      this.prisma.resource.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'ARCHIVED' },
        select: { id: true },
      }),
    );
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
    return this.writeAndRevalidate(
      CONTENT_TAGS.faqs,
      'faq created',
      this.prisma.faq.create({ data: { ...parsed.data, status: 'PUBLISHED' } }),
    );
  }

  @Patch('faqs/:id')
  @RequirePermission('faq:update')
  @Audit('faq.updated', 'Faq')
  async updateFaq(@Param('id') id: string, @Body() body: unknown) {
    const parsed = FaqUpsertSchema.partial().safeParse(body);
    if (!parsed.success) throw validationError(parsed.error.issues[0]?.message);
    await this.assertExists('faq', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.faqs,
      'faq updated',
      this.prisma.faq.update({ where: { id }, data: defined(parsed.data) }),
    );
  }

  @Delete('faqs/:id')
  @RequirePermission('faq:delete')
  @Audit('faq.deleted', 'Faq')
  async deleteFaq(@Param('id') id: string) {
    await this.assertExists('faq', id);
    return this.writeAndRevalidate(
      CONTENT_TAGS.faqs,
      'faq deleted',
      this.prisma.faq.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: { id: true },
      }),
    );
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

  private async assertExists(
    model: 'solution' | 'problem' | 'caseStudy' | 'faq' | 'article' | 'resource',
    id: string,
  ): Promise<void> {
    const where = { where: { id }, select: { id: true } };
    const found =
      model === 'solution'
        ? await this.prisma.solution.findUnique(where)
        : model === 'problem'
          ? await this.prisma.problem.findUnique(where)
          : model === 'caseStudy'
            ? await this.prisma.caseStudy.findUnique(where)
            : model === 'article'
              ? await this.prisma.article.findUnique(where)
              : model === 'resource'
                ? await this.prisma.resource.findUnique(where)
                : await this.prisma.faq.findUnique(where);

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
