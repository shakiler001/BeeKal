import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma.service.js';
import type { PermissionsService } from '../../access/infrastructure/permissions.service.js';
import { hashToken, issueToken } from '../../../shared/crypto/index.js';
import { AuthService } from './auth.service.js';

const password = 'Correct Horse Battery 2026!';

function harness(expiresAt = new Date(Date.now() + 60_000)) {
  const token = issueToken();
  const record = {
    id: 'user-id',
    email: 'test@example.com',
    inviteExpiresAt: expiresAt,
    passwordHash: null,
    status: 'INVITED',
    deletedAt: null,
  };
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const auditCreate = vi.fn().mockResolvedValue({ id: 'audit-id' });
  const findUnique = vi.fn().mockResolvedValue(record);
  const bumpVersion = vi.fn();
  const tx = { user: { updateMany }, auditLog: { create: auditCreate } };
  const prisma = {
    user: { findUnique },
    $transaction: vi.fn((run: (client: typeof tx) => Promise<boolean>) => run(tx)),
  } as unknown as PrismaService;
  const permissions = { bumpVersion } as unknown as PermissionsService;
  return {
    token,
    prisma,
    permissions,
    updateMany,
    auditCreate,
    findUnique,
    bumpVersion,
    service: new AuthService(prisma, permissions),
  };
}

describe('invitation password setup', () => {
  it('hashes the opaque token, expires it, clears it on use and writes an audit row', async () => {
    const { token, findUnique, bumpVersion, updateMany, auditCreate, service } = harness();
    expect(await service.setInitialPassword(token.raw, password)).toEqual({ ok: true });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { inviteTokenHash: hashToken(token.raw) },
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ inviteTokenHash: token.hash, status: 'INVITED' }),
        data: expect.objectContaining({
          inviteTokenHash: null,
          inviteExpiresAt: null,
          status: 'ACTIVE',
        }),
      }),
    );
    expect(auditCreate).toHaveBeenCalledOnce();
    expect(bumpVersion).toHaveBeenCalledOnce();
  });

  it('refuses expired invitations without a write', async () => {
    const { token, updateMany, service } = harness(new Date(Date.now() - 60_000));
    expect((await service.setInitialPassword(token.raw, password)).ok).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('treats a raced or reused invitation as invalid', async () => {
    const { token, updateMany, auditCreate, service } = harness();
    updateMany.mockResolvedValue({ count: 0 });
    expect((await service.setInitialPassword(token.raw, password)).ok).toBe(false);
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('does not accept an email address as a setup token', async () => {
    const { findUnique, service } = harness();
    findUnique.mockResolvedValueOnce(null);
    expect((await service.setInitialPassword('test@example.com', password)).ok).toBe(false);
  });
});
