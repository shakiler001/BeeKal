import { Injectable, Logger } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { PrismaService } from '../../../shared/prisma.service.js';
import { PermissionsService } from '../../access/infrastructure/permissions.service.js';
import { env } from '../../../config/env.js';
import { ARGON2_OPTIONS, checkPassword } from '../domain/password.js';
import { expiryFrom, hashToken, issueToken, shouldExtend } from '../../../shared/crypto/index.js';

export interface LoginContext {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; userId: string }
  | { ok: false; reason: 'invalid' | 'inactive' | 'no-password' };

export type SetPasswordResult = { ok: true } | { ok: false; reason: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async login(email: string, password: string, context: LoginContext): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, status: true, deletedAt: true },
    });

    // Hash against a dummy even when the user does not exist, so response time
    // does not reveal which addresses have accounts.
    if (!user?.passwordHash) {
      await verify(
        '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$8s5hVZ0YRLKZ0kxhbHlnbmVkbm90cmVhbA',
        password,
      ).catch(() => false);
      return { ok: false, reason: user ? 'no-password' : 'invalid' };
    }

    if (user.deletedAt || user.status !== 'ACTIVE') {
      return { ok: false, reason: 'inactive' };
    }

    const valid = await verify(user.passwordHash, password).catch(() => false);
    if (!valid) return { ok: false, reason: 'invalid' };

    const { raw, hash: tokenHash } = issueToken();
    const expiresAt = expiryFrom(new Date(), env().SESSION_TTL_HOURS);

    await this.prisma.$transaction([
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'session.created',
          entityType: 'Session',
          ip: context.ip ?? null,
        },
      }),
    ]);

    return { ok: true, token: raw, expiresAt, userId: user.id };
  }

  async logout(rawToken: string, userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'session.revoked', entityType: 'Session' },
    });
  }

  /** Revokes every other session. Used after a password change. */
  async revokeOtherSessions(userId: string, keepSessionId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, NOT: { id: keepSessionId } },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /** Sliding expiry, extended only past the halfway point. */
  async touchSession(sessionId: string, expiresAt: Date): Promise<Date> {
    const now = new Date();
    const ttl = env().SESSION_TTL_HOURS;
    if (!shouldExtend(expiresAt, now, ttl)) return expiresAt;

    const next = expiryFrom(now, ttl);
    await this.prisma.session.update({ where: { id: sessionId }, data: { expiresAt: next } });
    return next;
  }

  async changePassword(userId: string, current: string, next: string): Promise<SetPasswordResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true },
    });
    if (!user?.passwordHash) return { ok: false, reason: 'No password is set for this account' };

    const valid = await verify(user.passwordHash, current).catch(() => false);
    if (!valid) return { ok: false, reason: 'That is not your current password' };

    const check = checkPassword(next, user.email);
    if (!check.ok) return { ok: false, reason: check.reason };

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hash(next, ARGON2_OPTIONS) },
      }),
      this.prisma.auditLog.create({
        data: { userId, action: 'password.changed', entityType: 'User', entityId: userId },
      }),
    ]);

    return { ok: true };
  }

  /** Consume an invitation once; an email address can never act as a token. */
  async setInitialPassword(token: string, password: string): Promise<SetPasswordResult> {
    const invalid =
      'This invitation is invalid or has expired. Ask an administrator for a new one.';
    const now = new Date();
    const tokenHash = hashToken(token);
    const user = await this.prisma.user.findUnique({
      where: { inviteTokenHash: tokenHash },
      select: {
        id: true,
        email: true,
        inviteExpiresAt: true,
        passwordHash: true,
        status: true,
        deletedAt: true,
      },
    });
    if (
      !user ||
      user.deletedAt ||
      user.status !== 'INVITED' ||
      user.passwordHash ||
      !user.inviteExpiresAt ||
      user.inviteExpiresAt <= now
    ) {
      return { ok: false, reason: invalid };
    }

    const check = checkPassword(password, user.email);
    if (!check.ok) return { ok: false, reason: check.reason };

    const passwordHash = await hash(password, ARGON2_OPTIONS);
    const consumed = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: user.id,
          inviteTokenHash: tokenHash,
          passwordHash: null,
          status: 'INVITED',
          deletedAt: null,
          inviteExpiresAt: { gt: new Date() },
        },
        data: { passwordHash, status: 'ACTIVE', inviteTokenHash: null, inviteExpiresAt: null },
      });
      if (updated.count !== 1) return false;
      await tx.auditLog.create({
        data: { userId: user.id, action: 'password.set', entityType: 'User', entityId: user.id },
      });
      return true;
    });
    if (!consumed) return { ok: false, reason: invalid };

    this.permissions.bumpVersion();
    this.logger.log(`Initial password set for user ${user.id}`);
    return { ok: true };
  }

  async hashPassword(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }
}
