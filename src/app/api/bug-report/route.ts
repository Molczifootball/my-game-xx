import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { auth as nextAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await nextAuth();

    const { description, page } = await req.json();
    if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 });

    await prisma.bugReport.create({
      data: {
        description: description.trim(),
        page: page || null,
        reporterId: session?.user?.id || null,
        reporterName: session?.user?.name || 'Anonymous',
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Bug report error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
