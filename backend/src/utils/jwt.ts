import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export function signJwt(payload: JwtPayload): string {
  const opts: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, opts);
}

export function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }
  const { sub, email, role } = decoded as Record<string, unknown>;
  if (typeof sub !== 'string' || typeof email !== 'string' || (role !== 'CUSTOMER' && role !== 'ADMIN')) {
    throw new Error('Invalid token claims');
  }
  return { sub, email, role };
}
