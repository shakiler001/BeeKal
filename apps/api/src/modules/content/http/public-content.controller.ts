import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service.js';
import { Public } from '../../../shared/auth/index.js';

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
    return this.prisma.resource.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { order: 'asc' },
    });
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
