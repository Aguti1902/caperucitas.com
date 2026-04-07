import { PrismaClient } from '@prisma/client';

// Asegurar SSL en la URL antes de instanciar PrismaClient
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || '';
  if (url && !url.includes('sslmode')) {
    return url + '?sslmode=require';
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
