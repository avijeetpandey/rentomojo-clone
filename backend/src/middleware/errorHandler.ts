import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(HttpError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid request payload',
      details: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err, path: req.originalUrl }, 'Unhandled HttpError');
    }
    return res.status(err.status).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
  }

  const error = err as Error;
  logger.error({ err: error, path: req.originalUrl }, 'Unexpected error');
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong.',
  });
}
