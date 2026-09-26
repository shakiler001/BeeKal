import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma.service.js';
import type { PermissionsService } from '../infrastructure/permissions.service.js';
import { AccessController } from './access.controller.js';

describe('custom role deletion', () => {
  it('ignores deleted account memberships and removes them before deleting the role', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'role-id',
      isOwner: false,
      isSystem: false,
      _count: { users: 0 },
    });
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const deleteRole = vi.fn().mockResolvedValue({ id: 'role-id' });
    const tx = { userRole: { deleteMany }, role: { delete: deleteRole } };
    const prisma = {
      role: { findUnique },
      $transaction: vi.fn((run: (client: typeof tx) => Promise<void>) => run(tx)),
    } as unknown as PrismaService;
    const bumpVersion = vi.fn();
    const controller = new AccessController(prisma, {
      bumpVersion,
    } as unknown as PermissionsService);

    expect(await controller.deleteRole('role-id')).toEqual({ id: 'role-id' });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { users: { where: { user: { deletedAt: null } } } } },
        }),
      }),
    );
    expect(deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-id', user: { deletedAt: { not: null } } },
    });
    expect(deleteRole).toHaveBeenCalledWith({ where: { id: 'role-id' } });
    expect(bumpVersion).toHaveBeenCalledOnce();
  });
});
