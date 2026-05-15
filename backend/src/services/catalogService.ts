import { z } from 'zod';
import type { RentalTenure } from '@prisma/client';
import { productRepository, type ProductFilters } from '../repositories/productRepository';
import { categoryRepository } from '../repositories/productRepository';
import { HttpError } from '../utils/httpError';
import { ALL_TENURES, computePricing, TENURE_MONTHS } from './pricingService';

export const productListQuerySchema = z.object({
  city: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  take: z.coerce.number().int().min(1).max(120).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const pricingQuerySchema = z.object({
  tenure: z.enum(ALL_TENURES as [RentalTenure, ...RentalTenure[]]),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

function serializeProduct(p: Awaited<ReturnType<typeof productRepository.findBySlug>>) {
  if (!p) return null;
  const tenureOptions = ALL_TENURES.map((tenure) =>
    computePricing({
      baseMonthlyRent: p.baseMonthlyRent,
      depositAmount: p.depositAmount,
      discount3M: p.discount3M,
      discount6M: p.discount6M,
      discount12M: p.discount12M,
      tenure,
      quantity: 1,
    }),
  );
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    city: p.city,
    stock: p.stock,
    isActive: p.isActive,
    baseMonthlyRent: p.baseMonthlyRent,
    depositAmount: p.depositAmount,
    category: { id: p.category.id, slug: p.category.slug, name: p.category.name },
    tenureOptions,
  };
}

export const catalogService = {
  async listCategories() {
    return categoryRepository.list();
  },

  async listProducts(filters: ProductFilters) {
    const [items, total] = await Promise.all([
      productRepository.list(filters),
      productRepository.count(filters),
    ]);
    return {
      total,
      items: items.map((p) => serializeProduct(p)!),
    };
  },

  async getProduct(slug: string) {
    const p = await productRepository.findBySlug(slug);
    if (!p) throw HttpError.notFound('Product not found');
    return serializeProduct(p);
  },

  async getPricing(slug: string, tenure: RentalTenure, quantity: number) {
    const p = await productRepository.findBySlug(slug);
    if (!p) throw HttpError.notFound('Product not found');
    if (quantity > p.stock) throw HttpError.badRequest(`Only ${p.stock} unit(s) in stock`);
    return computePricing({
      baseMonthlyRent: p.baseMonthlyRent,
      depositAmount: p.depositAmount,
      discount3M: p.discount3M,
      discount6M: p.discount6M,
      discount12M: p.discount12M,
      tenure,
      quantity,
    });
  },

  tenureMonths: TENURE_MONTHS,
};
