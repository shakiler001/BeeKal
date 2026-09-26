import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../shared/prisma.service.js';
import { PermissionsService } from '../infrastructure/permissions.service.js';
import { hashToken, isExpired } from '../../../shared/crypto/index.js';
import { can, scopeFor } from '../domain/effective-permissions.js';
import { env } from '../../../config/env.js';
import {
  AUTHENTICATED_KEY,
  PERMISSION_KEY,
  PUBLIC_KEY,
} from '../../../shared/auth/require-permission.decorator.js';
import type { AuthenticatedRequest, AuthUser } from '../../../shared/auth/current-user.js';

/**
 * One guard, two jobs: establish who is asking, then decide whether they may.
 *
 * Both happen here so there is exactly one place authorization can be wrong,
 * and so a new endpoint cannot accidentally ship without a check — a route
 * with no @RequirePermission and no @Public is rejected rather than allowed.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.authenticate(request);

    const authenticatedOnly = this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (authenticatedOnly) return true;

    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail closed. An endpoint that declares nothing is a mistake, and treating
    // it as public is how admin data leaks.
    if (!required) {
      throw new ForbiddenException({
        code: 'NO_PERMISSION_DECLARED',
        message: 'This endpoint declares no permission requirement',
      });
    }

    if (!can(user.permissions, required)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `You do not have permission to ${required.replace(':', ' ')}`,
      });
    }

    return true;
  }

  private async authenticate(request: AuthenticatedRequest): Promise<AuthUser> {
    const cookies = request.cookies as Record<string, string> | undefined;
    const raw = cookies?.[env().SESSION_COOKIE_NAME];

    if (!raw) {
      throw new UnauthorizedException({ code: 'NO_SESSION', message: 'Sign in to continue' });
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(raw) },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: { select: { id: true, email: true, name: true, status: true, deletedAt: true } },
      },
    });

    if (!session || session.revokedAt || isExpired(session.expiresAt, new Date())) {
      throw new UnauthorizedException({ code: 'SESSION_INVALID', message: 'Sign in again' });
    }

    // A suspended or deleted user's existing session must stop working
    // immediately, not at its natural expiry.
    if (session.user.deletedAt || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'This account is no longer active',
      });
    }

    const permissions = await this.permissions.forUser(session.user.id);

    const authUser: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      permissions,
      can: (permission) => can(permissions, permission),
      scopeFor: (permission) => scopeFor(permissions, permission),
    };

    request.user = authUser;
    request.sessionId = session.id;
    return authUser;
  }
}
