import type { KycStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export const kycRepository = {
  updateStatus(userId: string, status: KycStatus, ref?: string | null) {
    return prisma.user
      .update({
        where: { id: userId },
        data: { kycStatus: status },
        select: { id: true, kycStatus: true },
      })
      .then((u) => ({ ...u, ref: ref ?? null }));
  },
};
