import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '../repositories/userRepository';
import { HttpError } from '../utils/httpError';
import { signJwt } from '../utils/jwt';

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20).optional(),
  city: z.string().min(2).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    city: string;
    role: 'CUSTOMER' | 'ADMIN';
    kycStatus: string;
  };
}

const BCRYPT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw HttpError.conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      city: input.city ?? 'Bangalore',
    });

    return buildAuthResult(user);
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw HttpError.unauthorized('Invalid email or password');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw HttpError.unauthorized('Invalid email or password');

    return buildAuthResult(user);
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw HttpError.notFound('User not found');
    return sanitize(user);
  },
};

function buildAuthResult(user: {
  id: string;
  email: string;
  fullName: string;
  city: string;
  role: 'CUSTOMER' | 'ADMIN';
  kycStatus: string;
}): AuthResult {
  const token = signJwt({ sub: user.id, email: user.email, role: user.role });
  return { token, user: sanitize(user) };
}

function sanitize(user: {
  id: string;
  email: string;
  fullName: string;
  city: string;
  role: 'CUSTOMER' | 'ADMIN';
  kycStatus: string;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    city: user.city,
    role: user.role,
    kycStatus: user.kycStatus,
  };
}
