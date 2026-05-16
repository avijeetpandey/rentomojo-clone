import { PrismaClient } from '../generated/prisma';
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

prisma.$on('query' as never, (e: { query: string; duration: number }) => {
  if (env.logLevel === 'debug') {
    logger.debug({ query: e.query, duration: e.duration }, 'prisma.query');
  }
});
prisma.$on('warn' as never, (e: { message: string }) => logger.warn({ msg: e.message }, 'prisma.warn'));
prisma.$on('error' as never, (e: { message: string }) => logger.error({ msg: e.message }, 'prisma.error'));
