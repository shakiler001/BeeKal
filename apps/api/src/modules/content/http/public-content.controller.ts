import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { EmailSchema } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import { Public } from '../../../shared/auth/index.js';
import { PUBLIC_WRITE_THROTTLE } from '../../../shared/throttle/throttle.config.js';

const DownloadRequestSchema = z.object({ email: EmailSchema });

/**
 * What the public site reads. Published rows only — a draft must never be
 * reachable from outside the admin, and filtering in the query rather than
 * after it means an unpublished row never leaves the database.
 */
@Controller('public/content')
export class PublicContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('solutions')
  async solutions() {
    return this.prisma.solution.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  @Public()
  @Get('problems')
  async problems() {
    return this.prisma.problem.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  @Public()
  @Get('case-studies')
  async caseStudies() {
    return this.prisma.caseStudy.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    });
  }

  @Public()
  @Get('faqs')
  async faqs() {
    return this.prisma.faq.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ group: 'asc' }, { order: 'asc' }],
    });
  }

  @Public()
  @Get('articles')
  async articles() {
    return this.prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
    });
  }

  @Public()
  @Get('resources')
  async resources() {
    const rows = await this.prisma.resource.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, fileUrl: { not: null } },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      hasFile: true,
      fileUrl: row.isGated ? null : row.fileUrl,
    }));
  }

  @Public()
  @Throttle(PUBLIC_WRITE_THROTTLE)
  @Post('resources/:slug/download')
  async downloadResource(@Param('slug') slug: string, @Body() body: unknown) {
    const parsed = DownloadRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Enter a valid email address');

    const resource = await this.prisma.resource.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null, fileUrl: { not: null } },
      select: { id: true, fileUrl: true, isGated: true },
    });
    if (!resource?.fileUrl || !resource.isGated) throw new NotFoundException();

    await this.prisma.$transaction([
      this.prisma.resourceDownload.create({
        data: { resourceId: resource.id, email: parsed.data.email, marketingConsent: false },
      }),
      this.prisma.resource.update({
        where: { id: resource.id },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);
    return { fileUrl: resource.fileUrl };
  }

  @Public()
  @Get('settings')
  async settings() {
    const rows = await this.prisma.setting.findMany({
      select: { key: true, value: true },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
}
