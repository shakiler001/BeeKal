import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service.js';
import { RequirePermission } from '../../../shared/auth/index.js';

/**
 * The activity log. Read-only by design: there is no update or delete
 * permission for it anywhere in the catalog, and none exists here either.
 * That is what makes it evidence rather than a note.
 */
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('audit:read')
  async list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        after: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
