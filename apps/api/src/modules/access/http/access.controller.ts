import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleUpsertSchema, type Permission, type Role } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import { PermissionsService } from '../infrastructure/permissions.service.js';
import { canEditRole } from '../domain/effective-permissions.js';
import { PERMISSIONS } from '../permissions.catalog.js';
import { Audit } from '../../../shared/audit/index.js';
import { RequirePermission } from '../../../shared/auth/index.js';

/**
 * Role management. This is the screen the "multi user configurable for
 * different roles" requirement is really about: roles are rows, created and
 * edited here, never in a migration.
 */
@Controller('access')
export class AccessController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  /** The catalog, grouped, so the role editor can render a matrix. */
  @Get('permissions')
  @RequirePermission('role:read')
  listPermissions(): Permission[] {
    return PERMISSIONS.map((p) => ({
      key: p.key,
      resource: p.resource,
      action: p.action,
      group: p.group,
      label: p.label,
    }));
  }

  @Get('roles')
  @RequirePermission('role:read')
  async listRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isOwner: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isSystem: true,
        isOwner: true,
        _count: { select: { users: true } },
        permissions: { select: { scope: true, permission: { select: { key: true } } } },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      isOwner: r.isOwner,
      userCount: r._count.users,
      grants: r.permissions.map((p) => ({ permissionKey: p.permission.key, scope: p.scope })),
    }));
  }

  @Post('roles')
  @RequirePermission('role:create')
  @Audit('role.created', 'Role')
  async createRole(@Body() body: unknown): Promise<{ id: string }> {
    const parsed = RoleUpsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check the role details',
      });
    }

    const key = slugify(parsed.data.name);
    const existing = await this.prisma.role.findUnique({ where: { key } });
    if (existing)
      throw new ConflictException({
        code: 'ROLE_EXISTS',
        message: 'A role with that name already exists',
      });

    const permissionIds = await this.resolvePermissionIds(parsed.data.grants);

    const role = await this.prisma.role.create({
      data: {
        key,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        isSystem: false,
        permissions: {
          create: parsed.data.grants.map((g) => ({
            permissionId: permissionIds.get(g.permissionKey) as string,
            scope: g.scope,
          })),
        },
      },
      select: { id: true },
    });

    this.permissions.bumpVersion();
    return role;
  }

  @Patch('roles/:id')
  @RequirePermission('role:update')
  @Audit('role.updated', 'Role')
  async updateRole(@Param('id') id: string, @Body() body: unknown): Promise<{ id: string }> {
    const parsed = RoleUpsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check the role details',
      });
    }

    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        isOwner: true,
        isSystem: true,
        permissions: { select: { permission: { select: { key: true } } } },
      },
    });
    if (!role) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Role not found' });

    const currentKeys = role.permissions.map((p) => p.permission.key);
    const nextKeys = new Set(parsed.data.grants.map((g) => g.permissionKey));
    const removing = currentKeys.filter((k) => !nextKeys.has(k));

    // The only hard-coded access rules in the system, and they exist so that
    // nobody can lock every administrator out.
    const verdict = canEditRole(role, { removingPermissions: removing, deleting: false });
    if (!verdict.allowed) {
      throw new BadRequestException({ code: 'ROLE_PROTECTED', message: verdict.reason });
    }

    const permissionIds = await this.resolvePermissionIds(parsed.data.grants);

    await this.prisma.$transaction([
      this.prisma.role.update({
        where: { id },
        data: { name: parsed.data.name, description: parsed.data.description ?? null },
      }),
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: parsed.data.grants.map((g) => ({
          roleId: id,
          permissionId: permissionIds.get(g.permissionKey) as string,
          scope: g.scope,
        })),
      }),
    ]);

    this.permissions.bumpVersion();
    return { id };
  }

  @Delete('roles/:id')
  @RequirePermission('role:delete')
  @Audit('role.deleted', 'Role')
  async deleteRole(@Param('id') id: string): Promise<{ id: string }> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, isOwner: true, isSystem: true, _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Role not found' });

    const verdict = canEditRole(role, { removingPermissions: [], deleting: true });
    if (!verdict.allowed) {
      throw new BadRequestException({ code: 'ROLE_PROTECTED', message: verdict.reason });
    }

    // Deleting a role out from under its holders would silently strip their
    // access. Reassignment is the caller's job, done deliberately.
    if (role._count.users > 0) {
      throw new ConflictException({
        code: 'ROLE_IN_USE',
        message: `${role._count.users} ${role._count.users === 1 ? 'user still holds' : 'users still hold'} this role. Reassign ${role._count.users === 1 ? 'them' : 'those users'} first.`,
      });
    }

    await this.prisma.role.delete({ where: { id } });
    this.permissions.bumpVersion();
    return { id };
  }

  private async resolvePermissionIds(
    grants: Array<{ permissionKey: string }>,
  ): Promise<Map<string, string>> {
    const keys = grants.map((g) => g.permissionKey);
    const rows = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.id]));

    const unknown = keys.filter((k) => !map.has(k));
    if (unknown.length > 0) {
      throw new BadRequestException({
        code: 'UNKNOWN_PERMISSION',
        message: `Unknown permission: ${unknown.join(', ')}`,
      });
    }
    return map;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
