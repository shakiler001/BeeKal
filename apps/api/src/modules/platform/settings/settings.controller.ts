import { BadRequestException, Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SettingUpdateSchema } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import { Audit } from '../../../shared/audit/index.js';
import { RequirePermission } from '../../../shared/auth/index.js';

/**
 * Business settings: the Assessment price, the contact email, the reply-time
 * promise. Grouped and labelled, because a bare key-value table invites
 * mistakes on the screen where the founder edits the price (docs/04 s4).
 */
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('setting:read')
  async list() {
    return this.prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  @Patch(':key')
  @RequirePermission('setting:update')
  @Audit('setting.updated', 'Setting')
  async update(@Param('key') key: string, @Body() body: unknown) {
    const parsed = SettingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Invalid value' });
    }

    const existing = await this.prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      throw new BadRequestException({ code: 'UNKNOWN_SETTING', message: 'No such setting' });
    }

    return this.prisma.setting.update({
      where: { key },
      // Prisma's Json column rejects a bare null; JsonNull is how you store one.
      data: { value: parsed.data.value === null ? Prisma.JsonNull : parsed.data.value },
    });
  }
}
