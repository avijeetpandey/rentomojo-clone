import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

if (env.nodeEnv !== 'production') {
  global.__prisma = prisma;
}

// @ts-expect-error Prisma's event typings narrow per-level; runtime accepts all.
prisma.$on('query', (e: { query: string; duration: number }) => {
  if (env.logLevel === 'debug') {
    logger.debug({ query: e.query, duration: e.duration }, 'prisma.query');
  }
});
// @ts-expect-error see above
prisma.$on('warn', (e: { message: string }) => logger.warn({ msg: e.message }, 'prisma.warn'));
// @ts-expect-error see above
prisma.$on('error', (e: { message: string }) => logger.error({ msg: e.message }, 'prisma.error'));
