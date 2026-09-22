import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service.js';
import {
  resolveEffectivePermissions,
  type EffectivePermissions,
  type RoleGrants,
} from '../domain/effective-permissions.js';

/**
 * Loads and caches a user's effective permissions.
 *
 * Cached per user, keyed by a version stamp that bumps whenever ANY role
 * changes. That way a permission revoked in the UI takes effect on the user's
 * next request rather than on their next login — which is the behaviour anyone
 * revoking access in a hurry expects (docs/04 section 3).
 *
 * The cache is in-process for now. Moving it to Redis is one adapter swap and
 * matters only once there is more than one API container.
 */
@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private readonly cache = new Map<
    string,
    { version: number; permissions: EffectivePermissions }
  >();
  private version = 0;

  constructor(private readonly prisma: PrismaService) {}

  /** Call after any role or grant change. Invalidates everyone at once. */
  bumpVersion(): void {
    this.version += 1;
    this.cache.clear();
    this.logger.log(`Permission cache invalidated (version ${this.version})`);
  }

  async forUser(userId: string): Promise<EffectivePermissions> {
    const cached = this.cache.get(userId);
    if (cached && cached.version === this.version) return cached.permissions;

    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            key: true,
            isOwner: true,
            permissions: {
              select: { scope: true, permission: { select: { key: true } } },
            },
          },
        },
      },
    });

    const roles: RoleGrants[] = rows.map((r) => ({
      roleKey: r.role.key,
      isOwner: r.role.isOwner,
      grants: r.role.permissions.map((rp) => ({
        permission: rp.permission.key,
        scope: rp.scope,
      })),
    }));

    const permissions = resolveEffectivePermissions(roles);
    this.cache.set(userId, { version: this.version, permissions });
    return permissions;
  }
}
