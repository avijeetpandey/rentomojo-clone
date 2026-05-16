import { Prisma, type RentalTenure } from '../generated/prisma';
import { prisma } from '../config/prisma';

export const cartRepository = {
  async ensureCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  },

  getWithItems(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  upsertItem(cartId: string, productId: string, tenure: RentalTenure, quantity: number) {
    return prisma.cartItem.upsert({
      where: {
        cartId_productId_tenure: { cartId, productId, tenure },
      },
      update: { quantity },
      create: { cartId, productId, tenure, quantity },
    });
  },

  updateItemQuantity(itemId: string, cartId: string, quantity: number) {
    return prisma.cartItem.updateMany({
      where: { id: itemId, cartId },
      data: { quantity },
    });
  },

  deleteItem(itemId: string, cartId: string) {
    return prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  },

  clear(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },

  findItemById(itemId: string) {
    return prisma.cartItem.findUnique({ where: { id: itemId } });
  },

  // exported for tests / order service usage
  _prismaErrors: Prisma,
};
