import { PrismaClient } from '@prisma/client';

function ensureSsl(url: string | undefined): string {
  if (!url) return '';
  if (url.includes('sslmode')) return url;
  return url + (url.includes('?') ? '&sslmode=require' : '?sslmode=require');
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: ensureSsl(process.env.DATABASE_URL) },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
