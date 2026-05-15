import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';
import { verifyJwt, type JwtPayload } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    throw HttpError.unauthorized('Missing or malformed Authorization header');
  }
  const token = header.slice(7).trim();
  if (!token) throw HttpError.unauthorized('Empty bearer token');

  try {
    req.user = verifyJwt(token);
  } catch {
    throw HttpError.unauthorized('Invalid or expired token');
  }
  next();
}

export function requireRole(role: 'ADMIN' | 'CUSTOMER') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw HttpError.unauthorized();
    if (req.user.role !== role) throw HttpError.forbidden(`Requires role: ${role}`);
    next();
  };
}
