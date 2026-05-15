import { computePricing, TENURE_MONTHS } from '../src/services/pricingService';

// ── minimal Prisma mock for the order & cart service unit tests ──────────────
// (The larger integration mock lives in catalog.test.ts; this file is self-contained.)
const users = new Map<string, any>();
const carts = new Map<string, any>(); // keyed by userId
const cartItems = new Map<string, any>();
const products = new Map<string, any>();
const orders = new Map<string, any>();
const orderItems = new Map<string, any>();
let seq = 0;
const uid = (p: string) => `${p}_${++seq}`;

jest.mock('../src/config/prisma', () => ({
  prisma: {
    $transaction: jest.fn(async (fn: (t: any) => Promise<any>) => fn(require('../src/config/prisma').prisma)),
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.email) return [...users.values()].find((u) => u.email === where.email) ?? null;
        if (where.id) return [...users.values()].find((u) => u.id === where.id) ?? null;
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const u = {
          id: uid('u'),
          role: 'CUSTOMER',
          kycStatus: 'NOT_SUBMITTED',
          ...data,
          email: data.email.toLowerCase(),
        };
        users.set(u.email, u);
        return u;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const u = [...users.values()].find((x) => x.id === where.id);
        if (u) Object.assign(u, data);
        return u;
      }),
    },
    product: {
      findUnique: jest.fn(async ({ where }: any) => {
        const p = where.id
          ? products.get(where.id)
          : [...products.values()].find((x) => x.slug === where.slug);
        if (!p) return null;
        return { ...p, category: { id: 'cat1', slug: 'furniture', name: 'Furniture' } };
      }),
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
      update: jest.fn(async ({ where, data }: any) => {
        const p = products.get(where.id);
        if (!p) throw new Error('Product not found');
        if (data.stock?.decrement !== undefined) p.stock -= data.stock.decrement;
        return p;
      }),
    },
    cart: {
      upsert: jest.fn(async ({ where, create }: any) => {
        const existing = carts.get(where.userId);
        if (existing) return existing;
        const cart = { id: uid('cart'), userId: where.userId, ...create };
        carts.set(where.userId, cart);
        return cart;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const cart = carts.get(where.userId);
        if (!cart) return null;
        const items = [...cartItems.values()]
          .filter((it) => it.cartId === cart.id)
          .map((it) => ({
            ...it,
            product: { ...products.get(it.productId), category: { slug: 'furniture', name: 'Furniture' } },
          }));
        return { ...cart, items };
      }),
    },
    cartItem: {
      deleteMany: jest.fn(async ({ where }: any) => {
        let count = 0;
        for (const [k, v] of cartItems.entries()) {
          if (where.cartId && v.cartId === where.cartId) {
            cartItems.delete(k);
            count++;
          }
        }
        return { count };
      }),
    },
    order: {
      create: jest.fn(async ({ data, include }: any) => {
        const order: any = {
          id: uid('ord'),
          status: data.status ?? 'PAID',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        orders.set(order.id, order);
        const items =
          data.items?.create?.map((it: any) => {
            const oi = { id: uid('oi'), orderId: order.id, ...it };
            orderItems.set(oi.id, oi);
            return oi;
          }) ?? [];
        if (include?.items) return { ...order, items };
        return order;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const o = orders.get(where.id);
        if (o) Object.assign(o, data);
        return o;
      }),
      findMany: jest.fn(async ({ where, include }: any) => {
        let list = [...orders.values()].filter((o) => !where?.userId || o.userId === where.userId);
        if (include?.items)
          list = list.map((o) => ({
            ...o,
            items: [...orderItems.values()].filter((oi) => oi.orderId === o.id),
          }));
        return list;
      }),
      findFirst: jest.fn(async ({ where, include }: any) => {
        const o = [...orders.values()].find((x) => x.id === where.id && x.userId === where.userId);
        if (!o) return null;
        if (include?.items)
          return { ...o, items: [...orderItems.values()].filter((oi) => oi.orderId === o.id) };
        return o;
      }),
    },
  },
}));

beforeEach(() => {
  users.clear();
  carts.clear();
  cartItems.clear();
  products.clear();
  orders.clear();
  orderItems.clear();
  seq = 0;
});

// ── tests ──────────────────────────────────────────────────────────────────
import { orderService } from '../src/services/orderService';
import { cartService } from '../src/services/cartService';

const validAddress = {
  addressLine1: '10 MG Road',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
  contactPhone: '9876543210',
};

describe('computePricing — edge cases', () => {
  const base = {
    baseMonthlyRent: 2500,
    depositAmount: 5000,
    discount3M: 0,
    discount6M: 0.05,
    discount12M: 0.1,
    quantity: 1,
  };

  it('clamps discount above 100% to 0 effective discount', () => {
    const p = computePricing({ ...base, tenure: 'M12', discount12M: 1.5 });
    expect(p.unitMonthlyRent).toBe(0);
  });

  it('rounds fractional rents to nearest integer', () => {
    const p = computePricing({ ...base, tenure: 'M6', discount6M: 0.333, quantity: 3 });
    expect(Number.isInteger(p.unitMonthlyRent)).toBe(true);
    expect(p.monthlyRent).toBe(p.unitMonthlyRent * 3);
  });

  it('M3 tenure months equals 3', () => {
    expect(TENURE_MONTHS['M3']).toBe(3);
    const p = computePricing({ ...base, tenure: 'M3' });
    expect(p.totalRentOverTenure).toBe(p.monthlyRent * 3);
  });
});

describe('orderService.create — validation', () => {
  it('throws 400 when cart is empty', async () => {
    await expect(orderService.create('user-no-cart', { address: validAddress })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('cartService — empty cart', () => {
  it('getCart returns zero totals for a brand-new user', async () => {
    const result = await cartService.getCart('brand-new-user-xyz');
    expect(result.items).toHaveLength(0);
    expect(result.summary.payableNow).toBe(0);
    expect(result.summary.itemCount).toBe(0);
  });
});
