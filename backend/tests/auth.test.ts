jest.mock('../src/config/prisma', () => {
  const users = new Map<string, any>();
  let seq = 0;
  return {
    prisma: {
      user: {
        findUnique: jest.fn(async ({ where }: any) => {
          if (where.email) return users.get(where.email.toLowerCase()) ?? null;
          if (where.id) {
            for (const u of users.values()) if (u.id === where.id) return u;
            return null;
          }
          return null;
        }),
        create: jest.fn(async ({ data }: any) => {
          seq += 1;
          const user = {
            id: `u_${seq}`,
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
          users.set(user.email, user);
          return user;
        }),
      },
      __reset: () => {
        users.clear();
        seq = 0;
      },
    },
  };
});

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

beforeEach(() => {
  (prisma as any).__reset();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a user, returns a JWT and sanitized user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'Alice@Example.com',
      password: 'supersecret1',
      fullName: 'Alice Doe',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid payloads with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'nope', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('rejects duplicate emails with 409', async () => {
    const body = { email: 'dup@example.com', password: 'password123', fullName: 'Dup User' };
    await request(app).post('/api/v1/auth/register').send(body);
    const res = await request(app).post('/api/v1/auth/register').send(body);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bob@example.com', password: 'password123', fullName: 'Bob' });
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('bob@example.com');
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me (protected)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'carol@example.com', password: 'password123', fullName: 'Carol' });
    const token = reg.body.token as string;

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('carol@example.com');
  });
});
