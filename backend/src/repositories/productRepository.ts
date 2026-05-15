import { type Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const categoryRepository = {
  list() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },
  findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },
  upsert(data: Prisma.CategoryCreateInput) {
    return prisma.category.upsert({
      where: { slug: data.slug },
      update: { name: data.name, description: data.description, iconName: data.iconName },
      create: data,
    });
  },
};

export interface ProductFilters {
  city?: string;
  categorySlug?: string;
  search?: string;
  take?: number;
  skip?: number;
}

export const productRepository = {
  list(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (filters.city) where.city = filters.city;
    if (filters.categorySlug) where.category = { slug: filters.categorySlug };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: filters.take ?? 60,
      skip: filters.skip ?? 0,
    });
  },

  count(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (filters.city) where.city = filters.city;
    if (filters.categorySlug) where.category = { slug: filters.categorySlug };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return prisma.product.count({ where });
  },

  findBySlug(slug: string) {
    return prisma.product.findUnique({ where: { slug }, include: { category: true } });
  },

  findById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: { category: true } });
  },

  upsert(data: Prisma.ProductCreateInput) {
    return prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        city: data.city,
        baseMonthlyRent: data.baseMonthlyRent,
        depositAmount: data.depositAmount,
        discount3M: data.discount3M,
        discount6M: data.discount6M,
        discount12M: data.discount12M,
        stock: data.stock,
        isActive: data.isActive,
        category: data.category,
      },
      create: data,
    });
  },
};
