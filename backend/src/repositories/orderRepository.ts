import { type Prisma, type OrderStatus, type RentalTenure } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  tenure: RentalTenure;
  monthlyRent: number;
  depositAmount: number;
  monthsCount: number;
}

export interface CreateOrderInput {
  userId: string;
  subtotal: number;
  depositTotal: number;
  totalDueNow: number;
  monthlyTotal: number;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  kycDocumentRef?: string | null;
  items: CreateOrderItemInput[];
}

export const orderRepository = {
  create(input: CreateOrderInput) {
    return prisma.$transaction(async (tx) => {
      // Stock validation + decrement, all inside the same transaction.
      for (const it of input.items) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product || !product.isActive) {
          throw new Error(`Product "${it.productName}" is no longer available`);
        }
        if (product.stock < it.quantity) {
          throw new Error(`Only ${product.stock} unit(s) of "${product.name}" in stock`);
        }
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          status: 'PAID',
          subtotal: input.subtotal,
          depositTotal: input.depositTotal,
          totalDueNow: input.totalDueNow,
          monthlyTotal: input.monthlyTotal,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          contactPhone: input.contactPhone,
          kycDocumentRef: input.kycDocumentRef ?? null,
          items: {
            create: input.items.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              tenure: it.tenure,
              monthlyRent: it.monthlyRent,
              depositAmount: it.depositAmount,
              monthsCount: it.monthsCount,
            })),
          },
        },
        include: { items: true },
      });

      // Empty the cart inside the same transaction.
      const cart = await tx.cart.findUnique({ where: { userId: input.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  },

  listForUser(userId: string, statuses?: OrderStatus[]) {
    const where: Prisma.OrderWhereInput = { userId };
    if (statuses?.length) where.status = { in: statuses };
    return prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByIdForUser(orderId: string, userId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
  },

  updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  },
};
