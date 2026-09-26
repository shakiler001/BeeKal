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
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InviteUserSchema, UserUpdateSchema, type AdminUser } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';
import { PermissionsService } from '../../access/infrastructure/permissions.service.js';
import { checkOwnerProtection } from '../../access/domain/effective-permissions.js';
import { Audit } from '../../../shared/audit/index.js';
import { CurrentUser, RequirePermission, type AuthUser } from '../../../shared/auth/index.js';
import { issueToken, expiryFrom } from '../../../shared/crypto/index.js';
import { MAILER, type Mailer } from '../../messaging/ports/mailer.port.js';
import { env } from '../../../config/env.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  @Get()
  @RequirePermission('user:read')
  async list(): Promise<AdminUser[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastLoginAt: true,
        mfaEnabledAt: true,
        roles: { select: { role: { select: { id: true, key: true, name: true } } } },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.status,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      mfaEnabled: u.mfaEnabledAt !== null,
      roles: u.roles.map((r) => r.role),
    }));
  }

  @Post()
  @RequirePermission('user:create')
  @Audit('user.invited', 'User')
  async invite(@Body() body: unknown): Promise<{ id: string; setupUrl?: string }> {
    const parsed = InviteUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check the details',
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      throw new ConflictException({
        code: 'USER_EXISTS',
        message: 'Someone already has an account with that email',
      });
    }

    await this.assertRolesExist(parsed.data.roleIds);

    this.assertInvitationDeliveryConfigured();

    const token = issueToken();
    const user = await this.prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        status: 'INVITED',
        // No password is set. The invitee sets their own; a default credential
        // in a repo is a default credential in production.
        passwordHash: null,
        inviteTokenHash: token.hash,
        inviteExpiresAt: expiryFrom(new Date(), 48),
        roles: { create: parsed.data.roleIds.map((roleId) => ({ roleId })) },
      },
      select: { id: true, email: true },
    });

    this.permissions.bumpVersion();

    return this.sendInvitation(user.id, user.email, parsed.data.name, token.raw);
  }

  @Post(':id/reinvite')
  @RequirePermission('user:update')
  @Audit('user.reinvited', 'User')
  async reinvite(@Param('id') id: string): Promise<{ id: string; setupUrl?: string }> {
    this.assertInvitationDeliveryConfigured();
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        passwordHash: true,
        deletedAt: true,
      },
    });
    if (!user || user.deletedAt || user.status !== 'INVITED' || user.passwordHash) {
      throw new NotFoundException({
        code: 'INVITE_NOT_FOUND',
        message: 'No pending invitation found',
      });
    }
    const token = issueToken();
    await this.prisma.user.update({
      where: { id },
      data: { inviteTokenHash: token.hash, inviteExpiresAt: expiryFrom(new Date(), 48) },
    });
    return this.sendInvitation(id, user.email, user.name, token.raw);
  }

  private async sendInvitation(id: string, email: string, name: string, rawToken: string) {
    const setupUrl = `${env().APP_URL}/admin/setup?token=${rawToken}`;
    const delivery = await this.mailer.send({
      to: { email, name },
      subject: 'Your Beekal invitation',
      text: `You have been invited to Beekal. Set your password within 48 hours:\n\n${setupUrl}\n\nIf you did not expect this, ignore this message.`,
      idempotencyKey: `user-invite-${id}-${new Date().toISOString()}`,
    });
    if (!delivery.ok) {
      throw new ServiceUnavailableException({
        code: 'INVITE_DELIVERY_FAILED',
        message:
          'The account was created but the invitation could not be delivered. Contact support before retrying.',
      });
    }
    // Console mail is local-only; let the operator copy the link explicitly.
    const appHost = new URL(env().APP_URL).hostname;
    const localConsole =
      env().MAIL_DRIVER === 'console' && ['localhost', '127.0.0.1'].includes(appHost);
    return localConsole ? { id, setupUrl } : { id };
  }

  private assertInvitationDeliveryConfigured() {
    if (
      env().MAIL_DRIVER === 'console' &&
      !['localhost', '127.0.0.1'].includes(new URL(env().APP_URL).hostname)
    ) {
      throw new ServiceUnavailableException({
        code: 'INVITE_MAIL_NOT_CONFIGURED',
        message: 'Configure SMTP before inviting people on a public site.',
      });
    }
  }

  @Patch(':id')
  @RequirePermission('user:update')
  @Audit('user.updated', 'User')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthUser,
  ): Promise<{ id: string }> {
    const parsed = UserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Check the details',
      });
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        passwordHash: true,
        deletedAt: true,
        roles: { select: { role: { select: { id: true, isOwner: true } } } },
      },
    });
    if (!target || target.deletedAt) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    }
    if (parsed.data.status === 'INVITED' && target.passwordHash) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'An account with a password cannot be returned to invited. Suspend it instead.',
      });
    }
    if (parsed.data.status === 'ACTIVE' && !target.passwordHash) {
      throw new BadRequestException({
        code: 'PASSWORD_REQUIRED',
        message: 'The invitee must finish password setup before activation.',
      });
    }

    const targetIsOwner = target.roles.some((r) => r.role.isOwner);

    // Guard against lockout: suspending or demoting the last Owner.
    const suspending = parsed.data.status && parsed.data.status !== 'ACTIVE';
    const losingOwner =
      parsed.data.roleIds !== undefined &&
      targetIsOwner &&
      !(await this.roleIdsIncludeOwner(parsed.data.roleIds));

    if (suspending || losingOwner) {
      const remainingOwners = await this.countActiveOwners();
      const verdict = checkOwnerProtection({
        targetIsOwner,
        remainingOwners,
        action: suspending ? 'deactivate' : 'remove-owner-role',
      });
      if (!verdict.allowed) {
        throw new BadRequestException({ code: 'OWNER_PROTECTED', message: verdict.reason });
      }
    }

    // Suspending yourself locks you out of the screen you are standing on.
    if (suspending && id === actor.id) {
      throw new BadRequestException({
        code: 'SELF_SUSPEND',
        message: 'You cannot suspend your own account',
      });
    }

    if (parsed.data.roleIds) await this.assertRolesExist(parsed.data.roleIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
        },
      });

      if (parsed.data.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: parsed.data.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }

      // A suspended user's live sessions must stop working now, not at expiry.
      if (suspending) {
        await tx.session.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    });

    this.permissions.bumpVersion();
    return { id };
  }

  @Delete(':id')
  @RequirePermission('user:delete')
  @Audit('user.deleted', 'User')
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthUser): Promise<{ id: string }> {
    if (id === actor.id) {
      throw new BadRequestException({
        code: 'SELF_DELETE',
        message: 'You cannot delete your own account',
      });
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, roles: { select: { role: { select: { isOwner: true } } } } },
    });
    if (!target) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });

    const targetIsOwner = target.roles.some((r) => r.role.isOwner);
    const verdict = checkOwnerProtection({
      targetIsOwner,
      remainingOwners: await this.countActiveOwners(),
      action: 'delete',
    });
    if (!verdict.allowed) {
      throw new BadRequestException({ code: 'OWNER_PROTECTED', message: verdict.reason });
    }

    // Soft delete, so the audit trail keeps pointing at a real person.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'SUSPENDED' },
      }),
      this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.permissions.bumpVersion();
    return { id };
  }

  private async countActiveOwners(): Promise<number> {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        roles: { some: { role: { isOwner: true } } },
      },
    });
  }

  private async roleIdsIncludeOwner(roleIds: string[]): Promise<boolean> {
    const count = await this.prisma.role.count({ where: { id: { in: roleIds }, isOwner: true } });
    return count > 0;
  }

  private async assertRolesExist(roleIds: string[]): Promise<void> {
    const found = await this.prisma.role.count({ where: { id: { in: roleIds } } });
    if (found !== roleIds.length) {
      throw new BadRequestException({
        code: 'UNKNOWN_ROLE',
        message: 'One of those roles does not exist',
      });
    }
  }
}
