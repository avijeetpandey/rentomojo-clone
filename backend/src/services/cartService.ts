import { z } from 'zod';
import type { RentalTenure } from '@prisma/client';
import { cartRepository } from '../repositories/cartRepository';
import { productRepository } from '../repositories/productRepository';
import { HttpError } from '../utils/httpError';
import { ALL_TENURES, computePricing, TENURE_MONTHS } from './pricingService';

export const addItemSchema = z.object({
  productId: z.string().min(1),
  tenure: z.enum(ALL_TENURES as [RentalTenure, ...RentalTenure[]]),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10),
});

function serializeCart(cart: Awaited<ReturnType<typeof cartRepository.getWithItems>>) {
  if (!cart) {
    return { id: null, items: [], summary: emptySummary() };
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
      id: it.id,
      productId: it.productId,
      quantity: it.quantity,
      tenure: it.tenure,
      months: TENURE_MONTHS[it.tenure],
      product: {
        id: it.product.id,
        slug: it.product.slug,
        name: it.product.name,
        imageUrl: it.product.imageUrl,
        city: it.product.city,
        stock: it.product.stock,
        category: { slug: it.product.category.slug, name: it.product.category.name },
      },
      pricing,
    };
  });

  const summary = items.reduce(
    (acc, it) => {
      acc.itemCount += it.quantity;
      acc.monthlyTotal += it.pricing.monthlyRent;
      acc.depositTotal += it.pricing.depositTotal;
      acc.totalRentOverTenure += it.pricing.totalRentOverTenure;
      return acc;
    },
    { itemCount: 0, monthlyTotal: 0, depositTotal: 0, totalRentOverTenure: 0 },
  );

  return {
    id: cart.id,
    items,
    summary: {
      ...summary,
      payableNow: summary.depositTotal + summary.monthlyTotal, // first month + deposit
    },
  };
}

function emptySummary() {
  return { itemCount: 0, monthlyTotal: 0, depositTotal: 0, totalRentOverTenure: 0, payableNow: 0 };
}

export const cartService = {
  async getCart(userId: string) {
    await cartRepository.ensureCart(userId);
    const cart = await cartRepository.getWithItems(userId);
    return serializeCart(cart);
  },

  async addItem(userId: string, input: z.infer<typeof addItemSchema>) {
    const product = await productRepository.findById(input.productId);
    if (!product || !product.isActive) throw HttpError.notFound('Product not found');
    if (input.quantity > product.stock) {
      throw HttpError.badRequest(`Only ${product.stock} unit(s) of "${product.name}" in stock`);
    }
    const cart = await cartRepository.ensureCart(userId);
    await cartRepository.upsertItem(cart.id, product.id, input.tenure, input.quantity);
    return this.getCart(userId);
  },

  async updateItem(userId: string, itemId: string, input: z.infer<typeof updateItemSchema>) {
    const cart = await cartRepository.ensureCart(userId);
    const existing = await cartRepository.findItemById(itemId);
    if (!existing || existing.cartId !== cart.id) throw HttpError.notFound('Cart item not found');
    const product = await productRepository.findById(existing.productId);
    if (!product) throw HttpError.notFound('Product no longer available');
    if (input.quantity > product.stock) {
      throw HttpError.badRequest(`Only ${product.stock} unit(s) of "${product.name}" in stock`);
    }
    await cartRepository.updateItemQuantity(itemId, cart.id, input.quantity);
    return this.getCart(userId);
  },

  async removeItem(userId: string, itemId: string) {
    const cart = await cartRepository.ensureCart(userId);
    const result = await cartRepository.deleteItem(itemId, cart.id);
    if (result.count === 0) throw HttpError.notFound('Cart item not found');
    return this.getCart(userId);
  },

  async clearCart(userId: string) {
    const cart = await cartRepository.ensureCart(userId);
    await cartRepository.clear(cart.id);
    return this.getCart(userId);
  },
};
