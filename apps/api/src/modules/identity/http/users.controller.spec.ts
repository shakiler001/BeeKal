import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../../shared/prisma.service.js';
import type { PermissionsService } from '../../access/infrastructure/permissions.service.js';
import type { AuthUser } from '../../../shared/auth/index.js';
import { UsersController } from './users.controller.js';

const userId = '00000000-0000-4000-8000-000000000001';
const roleId = '00000000-0000-4000-8000-000000000002';
const actor = { id: userId } as AuthUser;

function harness(targetIsOwner = false) {
  const findUnique = vi.fn().mockResolvedValue({
    id: userId,
    status: 'ACTIVE',
    passwordHash: 'hash',
    deletedAt: null,
    roles: targetIsOwner ? [{ role: { id: roleId, isOwner: true } }] : [],
  });
  const ownerCount = vi.fn().mockResolvedValue(1);
  const roleCount = vi.fn().mockResolvedValue(0);
  const prisma = {
    user: { findUnique, count: ownerCount },
    role: { count: roleCount },
  } as unknown as PrismaService;
  const controller = new UsersController(
    prisma,
    { bumpVersion: vi.fn() } as unknown as PermissionsService,
    { send: vi.fn() },
  );
  return { controller, findUnique, ownerCount };
}

describe('user administration guards', () => {
  it('rejects an invitation without a role', async () => {
    const { controller } = harness();
    await expect(
      controller.invite({
        name: 'Valid Name',
        email: 'valid@example.com',
        roleIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an empty role assignment', async () => {
    const { controller } = harness();
    await expect(controller.update(userId, { roleIds: [] }, actor)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuses self-suspension and self-deletion', async () => {
    const { controller } = harness();
    await expect(controller.update(userId, { status: 'SUSPENDED' }, actor)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.remove(userId, actor)).rejects.toThrow(BadRequestException);
  });

  it('protects the last active Owner from suspension, deletion, and demotion', async () => {
    const { controller, ownerCount } = harness(true);
    const other = { id: 'another-admin' } as AuthUser;
    await expect(controller.update(userId, { status: 'SUSPENDED' }, other)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.update(userId, { roleIds: [userId] }, other)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.remove(userId, other)).rejects.toThrow(BadRequestException);
    expect(ownerCount).toHaveBeenCalledTimes(3);
  });
});
