import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envVars = Object.keys(process.env)
    .filter(key => key.includes('DATABASE') || key.includes('SUPABASE') || key.includes('DIRECT'))
    .map(key => ({
      key,
      hasValue: !!process.env[key],
      valueStart: process.env[key]?.substring(0, 15) + '...',
    }));

  let dbHost = 'unknown';
  try {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    if (connectionString) {
      dbHost = new URL(connectionString).hostname;
    }
  } catch (e) {
    dbHost = 'Error parsing URL';
  }

  // Simple query to verify connection
  let connectionStatus = 'Not tested';
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    connectionStatus = 'Successful';
  } catch (err: any) {
    connectionStatus = `Failed: ${err.message}`;
  }

  return NextResponse.json({
    diagnostics: {
      dbHostUsedInCode: dbHost,
      connectionStatus,
      detectedEnvVars: envVars,
      timestamp: new Date().toISOString(),
    }
  });
}
