import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  ChangePasswordSchema,
  LoginSchema,
  SetPasswordSchema,
  type SessionUser,
} from '@beekal/contracts';
import { AuthService } from '../application/auth.service.js';
import { PrismaService } from '../../../shared/prisma.service.js';
import { PermissionsService } from '../../access/infrastructure/permissions.service.js';
import { env } from '../../../config/env.js';
import {
  CurrentUser,
  Public,
  RequirePermission,
  type AuthUser,
  type AuthenticatedRequest,
} from '../../../shared/auth/index.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  @Public()
  // Five attempts a minute. Online password guessing becomes pointless and a
  // person who mistyped is not locked out.
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Check your details' });
    }

    const result = await this.auth.login(parsed.data.email, parsed.data.password, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    if (!result.ok) {
      // One message for every failure mode. Distinguishing "no such account"
      // from "wrong password" hands an attacker a user-enumeration oracle.
      throw new UnauthorizedException({
        code: 'LOGIN_FAILED',
        message: 'That email and password do not match an active account',
      });
    }

    response.cookie(env().SESSION_COOKIE_NAME, result.token, this.cookieOptions(result.expiresAt));
    return { ok: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const cookies = request.cookies as Record<string, string> | undefined;
    const raw = cookies?.[env().SESSION_COOKIE_NAME];

    if (raw && request.user) {
      await this.auth.logout(raw, request.user.id);
    }

    response.clearCookie(env().SESSION_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  /**
   * The admin UI builds its navigation from this, so a user never sees a
   * section they cannot use (docs/04 section 4).
   */
  @Get('me')
  @RequirePermission('setting:read')
  async me(@CurrentUser() user: AuthUser): Promise<SessionUser> {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        mfaEnabledAt: true,
        roles: { select: { role: { select: { key: true } } } },
      },
    });

    return {
      id: record.id,
      email: record.email,
      name: record.name,
      roles: record.roles.map((r) => r.role.key),
      permissions: Object.fromEntries(user.permissions.byPermission),
      mfaEnabled: record.mfaEnabledAt !== null,
    };
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('set-password')
  @HttpCode(200)
  async setPassword(@Body() body: unknown): Promise<{ ok: true }> {
    const parsed = SetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check your details',
      });
    }

    // The invite token IS the email for now; a signed, expiring token arrives
    // with the invitation email in Phase 4.
    const result = await this.auth.setInitialPassword(parsed.data.token, parsed.data.password);
    if (!result.ok) {
      throw new BadRequestException({ code: 'SET_PASSWORD_FAILED', message: result.reason });
    }
    return { ok: true };
  }

  @Post('change-password')
  @RequirePermission('setting:read')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ ok: true; otherSessionsRevoked: number }> {
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check your details',
      });
    }

    const result = await this.auth.changePassword(
      user.id,
      parsed.data.current,
      parsed.data.password,
    );
    if (!result.ok) {
      throw new BadRequestException({ code: 'CHANGE_PASSWORD_FAILED', message: result.reason });
    }

    // Changing a password should end every other session — that is usually why
    // someone changes it.
    const revoked = await this.auth.revokeOtherSessions(user.id, request.sessionId ?? '');
    this.permissions.bumpVersion();

    return { ok: true, otherSessionsRevoked: revoked };
  }

  private cookieOptions(expiresAt: Date) {
    return {
      httpOnly: true,
      secure: env().NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: expiresAt,
    };
  }
}
