/** Parámetros de pool seguros para Supabase (session/transaction mode) */
export function buildDatabaseUrl(url: string | undefined): string {
  if (!url) return '';
  let result = url;
  if (!result.includes('sslmode')) {
    result += result.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  if (!result.includes('connection_limit=')) {
    result += '&connection_limit=3';
  }
  if (!result.includes('pool_timeout=')) {
    result += '&pool_timeout=20';
  }
  // Pooler de Supabase (puerto 6543) requiere pgbouncer para Prisma
  if (/:6543[/?]/.test(result)) {
    if (!result.includes('pgbouncer=')) {
      result += '&pgbouncer=true';
    }
  }
  return result;
}
