import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma.service.js';
import { PublicContentController } from './public-content.controller.js';

describe('public resources', () => {
  it('hides the file URL of gated resources', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'gated', slug: 'checklist', isGated: true, fileUrl: '/files/checklist.pdf' },
      { id: 'free', slug: 'score', isGated: false, fileUrl: '/score' },
    ]);
    const controller = new PublicContentController({
      resource: { findMany },
    } as unknown as PrismaService);

    const rows = await controller.resources();

    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', deletedAt: null, fileUrl: { not: null } },
      orderBy: { order: 'asc' },
    });
    expect(rows).toMatchObject([
      { slug: 'checklist', hasFile: true, fileUrl: null },
      { slug: 'score', hasFile: true, fileUrl: '/score' },
    ]);
  });

  it('records a gated download without marketing consent', async () => {
    const create = vi.fn().mockReturnValue('create-operation');
    const update = vi.fn().mockReturnValue('update-operation');
    const transaction = vi.fn().mockResolvedValue([]);
    const controller = new PublicContentController({
      resource: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'resource-id', isGated: true, fileUrl: '/files/guide.pdf' }),
        update,
      },
      resourceDownload: { create },
      $transaction: transaction,
    } as unknown as PrismaService);

    await expect(
      controller.downloadResource('guide', { email: ' Reader@Example.com ' }),
    ).resolves.toEqual({ fileUrl: '/files/guide.pdf' });
    expect(create).toHaveBeenCalledWith({
      data: { resourceId: 'resource-id', email: 'reader@example.com', marketingConsent: false },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'resource-id' },
      data: { downloadCount: { increment: 1 } },
    });
    expect(transaction).toHaveBeenCalledWith(['create-operation', 'update-operation']);
  });
});
