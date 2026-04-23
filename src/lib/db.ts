import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    let connectionString = process.env.SUPABASE_DATABASE_URL;
    if (connectionString) {
      const host = new URL(connectionString).hostname;
      console.log('🔌 Prisma connecting to host:', host);
      // Strip sslmode from URL — newer pg versions treat sslmode=require as
      // verify-full, which overrides our ssl config and rejects Supabase certs.
      const url = new URL(connectionString);
      url.searchParams.delete('sslmode');
      connectionString = url.toString();
    }
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
