import { z } from 'zod';
import { cartRepository } from '../repositories/cartRepository';
import { orderRepository } from '../repositories/orderRepository';
import { HttpError } from '../utils/httpError';
import { computePricing, TENURE_MONTHS } from './pricingService';

export const addressSchema = z.object({
  addressLine1: z.string().min(4).max(120),
  addressLine2: z.string().max(120).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{4,10}$/, 'Invalid pincode'),
  contactPhone: z.string().min(7).max(20),
});

export const createOrderSchema = z.object({
  address: addressSchema,
  kycDocumentRef: z.string().min(1).max(255).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderService = {
  async create(userId: string, input: CreateOrderInput) {
    const cart = await cartRepository.getWithItems(userId);
    if (!cart || cart.items.length === 0) {
      throw HttpError.badRequest('Your cart is empty');
    }

    const items = cart.items.map((it) => {
      const pricing = computePricing({
        baseMonthlyRent: it.product.baseMonthlyRent,
        depositAmount: it.product.depositAmount,
        discount3M: it.product.discount3M,
        discount6M: it.product.discount6M,
        discount12M: it.product.discount12M,
        tenure: it.tenure,
        quantity: it.quantity,
      });
      return {
        productId: it.productId,
        productName: it.product.name,
        quantity: it.quantity,
        tenure: it.tenure,
        monthlyRent: pricing.monthlyRent,
        depositAmount: pricing.depositTotal,
        monthsCount: TENURE_MONTHS[it.tenure],
      };
    });

    const monthlyTotal = items.reduce((s, i) => s + i.monthlyRent, 0);
    const depositTotal = items.reduce((s, i) => s + i.depositAmount, 0);
    const subtotal = items.reduce((s, i) => s + i.monthlyRent * i.monthsCount, 0);
    const totalDueNow = monthlyTotal + depositTotal;

    try {
      const order = await orderRepository.create({
        userId,
        subtotal,
        depositTotal,
        totalDueNow,
        monthlyTotal,
        addressLine1: input.address.addressLine1,
        addressLine2: input.address.addressLine2 ?? null,
        city: input.address.city,
        state: input.address.state,
        pincode: input.address.pincode,
        contactPhone: input.address.contactPhone,
        kycDocumentRef: input.kycDocumentRef ?? null,
        items,
      });

      // Promote freshly-paid orders to ACTIVE so the dashboard reflects them.
      const active = await orderRepository.updateStatus(order.id, 'ACTIVE');
      return { ...order, status: active.status };
    } catch (err) {
      const msg = (err as Error).message;
      if (/stock|available/i.test(msg)) throw HttpError.badRequest(msg);
      throw err;
    }
  },

  async listForUser(userId: string) {
    const orders = await orderRepository.listForUser(userId);
    return orders.map(serializeOrder);
  },

  async getForUser(userId: string, orderId: string) {
    const order = await orderRepository.findByIdForUser(orderId, userId);
    if (!order) throw HttpError.notFound('Order not found');
    return serializeOrder(order);
  },
};

function serializeOrder(o: Awaited<ReturnType<typeof orderRepository.findByIdForUser>>) {
  if (!o) return null;
  return {
    id: o.id,
    status: o.status,
    subtotal: o.subtotal,
    depositTotal: o.depositTotal,
    totalDueNow: o.totalDueNow,
    monthlyTotal: o.monthlyTotal,
    address: {
      addressLine1: o.addressLine1,
      addressLine2: o.addressLine2,
      city: o.city,
      state: o.state,
      pincode: o.pincode,
      contactPhone: o.contactPhone,
    },
    kycDocumentRef: o.kycDocumentRef,
    createdAt: o.createdAt,
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      tenure: it.tenure,
      monthsCount: it.monthsCount,
      monthlyRent: it.monthlyRent,
      depositAmount: it.depositAmount,
    })),
  };
}
