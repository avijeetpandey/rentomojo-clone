import { apiFetch } from './api';

export type Tenure = 'M1' | 'M3' | 'M6' | 'M12';
export const ALL_TENURES: Tenure[] = ['M1', 'M3', 'M6', 'M12'];
export const TENURE_LABEL: Record<Tenure, string> = {
  M1: '1 month',
  M3: '3 months',
  M6: '6 months',
  M12: '12 months',
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
}

export interface PricingBreakdown {
  tenure: Tenure;
  months: number;
  quantity: number;
  unitMonthlyRent: number;
  monthlyRent: number;
  discountPct: number;
  depositPerUnit: number;
  depositTotal: number;
  totalRentOverTenure: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  city: string;
  stock: number;
  isActive: boolean;
  baseMonthlyRent: number;
  depositAmount: number;
  category: { id: string; slug: string; name: string };
  tenureOptions: PricingBreakdown[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  tenure: Tenure;
  months: number;
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    city: string;
    stock: number;
    category: { slug: string; name: string };
  };
  pricing: PricingBreakdown;
}

export interface CartSummary {
  itemCount: number;
  monthlyTotal: number;
  depositTotal: number;
  totalRentOverTenure: number;
  payableNow: number;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  summary: CartSummary;
}

export const catalogApi = {
  listCategories: () => apiFetch<{ items: Category[] }>('/api/v1/categories'),

  listProducts: (params: { city?: string; category?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set('city', params.city);
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    const q = qs.toString();
    return apiFetch<{ total: number; items: Product[] }>(`/api/v1/products${q ? `?${q}` : ''}`);
  },

  getProduct: (slug: string) => apiFetch<{ product: Product }>(`/api/v1/products/${slug}`),

  getPricing: (slug: string, tenure: Tenure, quantity: number) =>
    apiFetch<{ pricing: PricingBreakdown }>(
      `/api/v1/products/${slug}/pricing?tenure=${tenure}&quantity=${quantity}`,
    ),
};

export const cartApi = {
  get: (token: string) => apiFetch<{ cart: Cart }>('/api/v1/cart', { token }),
  add: (token: string, body: { productId: string; tenure: Tenure; quantity: number }) =>
    apiFetch<{ cart: Cart }>('/api/v1/cart/items', { method: 'POST', token, body }),
  update: (token: string, itemId: string, quantity: number) =>
    apiFetch<{ cart: Cart }>(`/api/v1/cart/items/${itemId}`, { method: 'PATCH', token, body: { quantity } }),
  remove: (token: string, itemId: string) =>
    apiFetch<{ cart: Cart }>(`/api/v1/cart/items/${itemId}`, { method: 'DELETE', token }),
  clear: (token: string) => apiFetch<{ cart: Cart }>('/api/v1/cart', { method: 'DELETE', token }),
};
