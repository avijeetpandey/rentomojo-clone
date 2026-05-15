// Catalog + cart integration tests with an in-memory Prisma mock.
type AnyObj = Record<string, any>;

const state = {
  users: new Map<string, AnyObj>(),
  categories: new Map<string, AnyObj>(),
  products: new Map<string, AnyObj>(),
  carts: new Map<string, AnyObj>(), // by userId
  cartItems: new Map<string, AnyObj>(), // by id
  orders: new Map<string, AnyObj>(), // by id
  orderItems: new Map<string, AnyObj>(), // by id
  seq: 0,
};

function id(prefix: string) {
  state.seq += 1;
  return `${prefix}_${state.seq}`;
}

function matchesProductWhere(p: AnyObj, where: AnyObj | undefined): boolean {
  if (!where) return true;
  if (where.isActive !== undefined && p.isActive !== where.isActive) return false;
  if (where.city && p.city !== where.city) return false;
  if (where.category?.slug) {
    const cat = [...state.categories.values()].find((c) => c.id === p.categoryId);
    if (!cat || cat.slug !== where.category.slug) return false;
  }
  if (Array.isArray(where.OR)) {
    const ok = where.OR.some((cond: AnyObj) => {
      if (cond.name?.contains) return p.name.toLowerCase().includes(cond.name.contains.toLowerCase());
      if (cond.description?.contains)
        return p.description.toLowerCase().includes(cond.description.contains.toLowerCase());
      return false;
    });
    if (!ok) return false;
  }
  return true;
}

jest.mock('../src/config/prisma', () => {
  return {
    prisma: {
      $transaction: jest.fn(async (fn: (t: AnyObj) => Promise<any>) => {
        // Run inside same global mock — we hand the same prisma object back.
        return fn(require('../src/config/prisma').prisma);
      }),
      user: {
        findUnique: jest.fn(async ({ where }: AnyObj) => {
          if (where.email) return state.users.get(where.email.toLowerCase()) ?? null;
          if (where.id) return [...state.users.values()].find((u) => u.id === where.id) ?? null;
          return null;
        }),
        create: jest.fn(async ({ data }: AnyObj) => {
          const u = {
            id: id('u'),
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            fullName: data.fullName,
            phone: data.phone ?? null,
            city: data.city ?? 'Bangalore',
            role: 'CUSTOMER',
            kycStatus: 'NOT_SUBMITTED',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.users.set(u.email, u);
          return u;
        }),
        update: jest.fn(async ({ where, data, select }: AnyObj) => {
          const user = [...state.users.values()].find((u) => u.id === where.id);
          if (!user) throw new Error('User not found');
          Object.assign(user, data);
          if (select) {
            const out: AnyObj = {};
            for (const k of Object.keys(select)) if (select[k]) out[k] = user[k];
            return out;
          }
          return user;
        }),
      },
      category: {
        findMany: jest.fn(async () => [...state.categories.values()]),
        findUnique: jest.fn(
          async ({ where }: AnyObj) =>
            [...state.categories.values()].find((c) => c.slug === where.slug) ?? null,
        ),
        upsert: jest.fn(async ({ where, create }: AnyObj) => {
          const existing = [...state.categories.values()].find((c) => c.slug === where.slug);
          if (existing) return existing;
          const cat = { id: id('cat'), ...create };
          state.categories.set(cat.id, cat);
          return cat;
        }),
      },
      product: {
        findMany: jest.fn(async ({ where, take = 60, skip = 0 }: AnyObj) => {
          const all = [...state.products.values()].filter((p) => matchesProductWhere(p, where));
          return all.slice(skip, skip + take).map((p) => ({
            ...p,
            category: [...state.categories.values()].find((c) => c.id === p.categoryId),
          }));
        }),
        count: jest.fn(
          async ({ where }: AnyObj) =>
            [...state.products.values()].filter((p) => matchesProductWhere(p, where)).length,
        ),
        findUnique: jest.fn(async ({ where }: AnyObj) => {
          let p: AnyObj | undefined;
          if (where.slug) p = [...state.products.values()].find((x) => x.slug === where.slug);
          if (where.id) p = [...state.products.values()].find((x) => x.id === where.id);
          if (!p) return null;
          return { ...p, category: [...state.categories.values()].find((c) => c.id === p!.categoryId) };
        }),
        upsert: jest.fn(async ({ where, create }: AnyObj) => {
          const existing = [...state.products.values()].find((p) => p.slug === where.slug);
          if (existing) return existing;
          const p = { id: id('prod'), ...create };
          state.products.set(p.id, p);
          return p;
        }),
        update: jest.fn(async ({ where, data }: AnyObj) => {
          const p = state.products.get(where.id);
          if (!p) throw new Error('Product not found');
          if (data.stock?.decrement !== undefined) p.stock -= data.stock.decrement;
          else if (data.stock !== undefined) p.stock = data.stock;
          if (data.isActive !== undefined) p.isActive = data.isActive;
          return p;
        }),
      },
      cart: {
        upsert: jest.fn(async ({ where, create }: AnyObj) => {
          const existing = state.carts.get(where.userId);
          if (existing) return existing;
          const cart = {
            id: id('cart'),
            userId: where.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create,
          };
          state.carts.set(where.userId, cart);
          return cart;
        }),
        findUnique: jest.fn(async ({ where }: AnyObj) => {
          const cart = state.carts.get(where.userId);
          if (!cart) return null;
          const items = [...state.cartItems.values()]
            .filter((it) => it.cartId === cart.id)
            .map((it) => {
              const product = [...state.products.values()].find((p) => p.id === it.productId);
              const category = product
                ? [...state.categories.values()].find((c) => c.id === product.categoryId)
                : null;
              return { ...it, product: { ...product, category } };
            });
          return { ...cart, items };
        }),
      },
      cartItem: {
        upsert: jest.fn(async ({ where, update, create }: AnyObj) => {
          const key = where.cartId_productId_tenure;
          const existing = [...state.cartItems.values()].find(
            (it) => it.cartId === key.cartId && it.productId === key.productId && it.tenure === key.tenure,
          );
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            return existing;
          }
          const it = {
            id: id('ci'),
            cartId: create.cartId,
            productId: create.productId,
            tenure: create.tenure,
            quantity: create.quantity,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.cartItems.set(it.id, it);
          return it;
        }),
        updateMany: jest.fn(async ({ where, data }: AnyObj) => {
          let count = 0;
          for (const it of state.cartItems.values()) {
            if (it.id === where.id && it.cartId === where.cartId) {
              Object.assign(it, data);
              count += 1;
            }
          }
          return { count };
        }),
        deleteMany: jest.fn(async ({ where }: AnyObj) => {
          let count = 0;
          for (const [k, v] of state.cartItems.entries()) {
            const matchId = where.id ? v.id === where.id : true;
            const matchCart = where.cartId ? v.cartId === where.cartId : true;
            if (matchId && matchCart) {
              state.cartItems.delete(k);
              count += 1;
            }
          }
          return { count };
        }),
        findUnique: jest.fn(async ({ where }: AnyObj) => state.cartItems.get(where.id) ?? null),
      },
      order: {
        create: jest.fn(async ({ data, include }: AnyObj) => {
          const order: AnyObj = {
            id: id('ord'),
            userId: data.userId,
            status: data.status ?? 'PENDING_PAYMENT',
            subtotal: data.subtotal,
            depositTotal: data.depositTotal,
            totalDueNow: data.totalDueNow,
            monthlyTotal: data.monthlyTotal,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2 ?? null,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            contactPhone: data.contactPhone,
            kycDocumentRef: data.kycDocumentRef ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.orders.set(order.id, order);
          if (data.items?.create) {
            for (const it of data.items.create) {
              const oi = { id: id('oi'), orderId: order.id, ...it };
              state.orderItems.set(oi.id, oi);
            }
          }
          if (include?.items) {
            return {
              ...order,
              items: [...state.orderItems.values()].filter((oi) => oi.orderId === order.id),
            };
          }
          return order;
        }),
        update: jest.fn(async ({ where, data }: AnyObj) => {
          const o = state.orders.get(where.id);
          if (!o) throw new Error('Order not found');
          Object.assign(o, data, { updatedAt: new Date() });
          return o;
        }),
        findMany: jest.fn(async ({ where, include }: AnyObj) => {
          let list = [...state.orders.values()];
          if (where?.userId) list = list.filter((o) => o.userId === where.userId);
          if (where?.status?.in) list = list.filter((o) => where.status.in.includes(o.status));
          list = list.sort((a, b) => +b.createdAt - +a.createdAt);
          if (include?.items) {
            return list.map((o) => ({
              ...o,
              items: [...state.orderItems.values()].filter((oi) => oi.orderId === o.id),
            }));
          }
          return list;
        }),
        findFirst: jest.fn(async ({ where, include }: AnyObj) => {
          const o = [...state.orders.values()].find((x) => x.id === where.id && x.userId === where.userId);
          if (!o) return null;
          if (include?.items) {
            return { ...o, items: [...state.orderItems.values()].filter((oi) => oi.orderId === o.id) };
          }
          return o;
        }),
      },
      __reset: () => {
        state.users.clear();
        state.categories.clear();
        state.products.clear();
        state.carts.clear();
        state.cartItems.clear();
        state.orders.clear();
        state.orderItems.clear();
        state.seq = 0;
      },
      __seed: async () => {
        const cat = {
          id: id('cat'),
          slug: 'furniture',
          name: 'Furniture',
          description: null,
          iconName: null,
          createdAt: new Date(),
        };
        state.categories.set(cat.id, cat);
        const prod = {
          id: id('prod'),
          slug: 'sofa-bangalore',
          name: 'Test Sofa',
          description: 'Comfy.',
          imageUrl: 'https://x/img',
          city: 'Bangalore',
          categoryId: cat.id,
          baseMonthlyRent: 1000,
          depositAmount: 2000,
          discount3M: 0,
          discount6M: 0.05,
          discount12M: 0.1,
          stock: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.products.set(prod.id, prod);
        return { cat, prod };
      },
    },
  };
});

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

async function authToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'cart@example.com', password: 'password123', fullName: 'Cart User' });
  return res.body.token as string;
}

beforeEach(async () => {
  (prisma as any).__reset();
  await (prisma as any).__seed();
});

describe('Catalog API', () => {
  it('GET /api/v1/categories returns seeded categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('furniture');
  });

  it('GET /api/v1/products filters by city and category', async () => {
    const res = await request(app).get('/api/v1/products?city=Bangalore&category=furniture');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('sofa-bangalore');
    expect(res.body.items[0].tenureOptions).toHaveLength(4);
  });

  it('GET /api/v1/products/:slug returns full pricing options', async () => {
    const res = await request(app).get('/api/v1/products/sofa-bangalore');
    expect(res.status).toBe(200);
    const p = res.body.product;
    expect(p.tenureOptions.find((t: any) => t.tenure === 'M12').unitMonthlyRent).toBe(900);
  });

  it('GET /api/v1/products/:slug/pricing computes dynamic price', async () => {
    const res = await request(app).get('/api/v1/products/sofa-bangalore/pricing?tenure=M6&quantity=2');
    expect(res.status).toBe(200);
    expect(res.body.pricing.unitMonthlyRent).toBe(950);
    expect(res.body.pricing.monthlyRent).toBe(1900);
    expect(res.body.pricing.depositTotal).toBe(4000);
  });

  it('rejects out-of-stock quantity', async () => {
    const res = await request(app).get('/api/v1/products/sofa-bangalore/pricing?tenure=M3&quantity=10');
    expect(res.status).toBe(400);
  });
});

describe('Cart API', () => {
  let token: string;
  let productId: string;

  beforeEach(async () => {
    token = await authToken();
    const list = await request(app).get('/api/v1/products');
    productId = list.body.items[0].id;
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('returns an empty cart initially', async () => {
    const res = await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
    expect(res.body.cart.summary.itemCount).toBe(0);
  });

  it('adds an item and recomputes totals', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, tenure: 'M6', quantity: 2 });
    expect(res.status).toBe(201);
    const cart = res.body.cart;
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].pricing.monthlyRent).toBe(1900);
    expect(cart.summary.monthlyTotal).toBe(1900);
    expect(cart.summary.depositTotal).toBe(4000);
    expect(cart.summary.payableNow).toBe(5900);
  });

  it('rejects adding more than in-stock quantity', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, tenure: 'M3', quantity: 9 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/stock/i);
  });

  it('updates and removes cart items', async () => {
    const added = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, tenure: 'M3', quantity: 1 });
    const itemId = added.body.cart.items[0].id;

    const upd = await request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });
    expect(upd.status).toBe(200);
    expect(upd.body.cart.items[0].quantity).toBe(3);

    const del = await request(app)
      .delete(`/api/v1/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.cart.items).toHaveLength(0);
  });
});

describe('Checkout / Orders / KYC', () => {
  let token: string;
  let productId: string;

  const address = {
    addressLine1: '42 Indiranagar 100ft Rd',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    contactPhone: '9999999999',
  };

  beforeEach(async () => {
    token = await authToken();
    const list = await request(app).get('/api/v1/products');
    productId = list.body.items[0].id;
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, tenure: 'M6', quantity: 2 });
  });

  it('POST /api/v1/checkout/kyc approves valid documents', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/kyc')
      .set('Authorization', `Bearer ${token}`)
      .send({ documentType: 'PASSPORT', documentNumber: 'P1234567', documentRef: 'passport.pdf' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  it('POST /api/v1/checkout/kyc rejects suspicious Aadhaar', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/kyc')
      .set('Authorization', `Bearer ${token}`)
      .send({ documentType: 'AADHAAR', documentNumber: '123456780000', documentRef: 'aadhaar.pdf' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rejected/i);
  });

  it('POST /api/v1/checkout/orders creates an active order, clears cart, and decrements stock', async () => {
    const before = await request(app)
      .get('/api/v1/products')
      .then((r) => r.body.items[0].stock);
    expect(before).toBe(5);

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ address, kycDocumentRef: 'passport.pdf' });

    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe('ACTIVE');
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.monthlyTotal).toBe(1900); // 2 × 950
    expect(res.body.order.depositTotal).toBe(4000); // 2 × 2000
    expect(res.body.order.totalDueNow).toBe(5900);
    expect(res.body.order.subtotal).toBe(1900 * 6);

    const cart = await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${token}`);
    expect(cart.body.cart.items).toHaveLength(0);

    const after = await request(app)
      .get('/api/v1/products')
      .then((r) => r.body.items[0].stock);
    expect(after).toBe(3);
  });

  it('rejects checkout with empty cart', async () => {
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ address });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/empty/i);
  });

  it('GET /api/v1/checkout/orders lists active rentals', async () => {
    await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ address });

    const res = await request(app).get('/api/v1/checkout/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].status).toBe('ACTIVE');
    expect(res.body.orders[0].address.pincode).toBe('560038');
  });
});
