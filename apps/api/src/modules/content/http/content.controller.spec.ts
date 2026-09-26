import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma.service.js';
import { ContentController } from './content.controller.js';

describe('content existence checks', () => {
  for (const type of ['article', 'resource'] as const) {
    it(`updates and deletes an existing ${type} without checking the FAQ table`, async () => {
      const findUnique = vi.fn().mockResolvedValue({ id: 'item-id' });
      const update = vi.fn().mockReturnValue('write-operation');
      const faqFindUnique = vi.fn();
      const prisma = {
        [type]: { findUnique, update },
        faq: { findUnique: faqFindUnique },
        outboxEvent: { create: vi.fn().mockReturnValue('outbox-operation') },
        $transaction: vi.fn().mockResolvedValue([{ id: 'item-id' }, {}]),
      } as unknown as PrismaService;
      const controller = new ContentController(prisma);

      if (type === 'article') {
        await controller.updateArticle('item-id', {});
        await controller.deleteArticle('item-id');
      } else {
        await controller.updateResource('item-id', {});
        await controller.deleteResource('item-id');
      }

      expect(findUnique).toHaveBeenCalledTimes(2);
      expect(faqFindUnique).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledTimes(2);
    });
  }
});
