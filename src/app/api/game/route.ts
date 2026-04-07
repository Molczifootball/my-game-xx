import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getAuthAndPrisma() {
  const { auth } = await import('@/lib/auth');
  const { getPrisma } = await import('@/lib/db');
  return { auth, prisma: getPrisma() };
}

// GET — Load game state for current user
export async function GET() {
  try {
    const { auth, prisma } = await getAuthAndPrisma();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ state: null, error: 'Not authenticated' }, { status: 401 });
    }

    const save = await prisma.gameSave.findUnique({ where: { userId: session.user.id } });
    return NextResponse.json({ state: save?.state || null });
  } catch (error) {
    console.error('Failed to load game state:', error);
    return NextResponse.json({ state: null, error: 'Failed to load' }, { status: 500 });
  }
}

// POST — Save game state for current user
export async function POST(req: NextRequest) {
  try {
    const { auth, prisma } = await getAuthAndPrisma();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { state, playerName } = await req.json();
    if (!state) {
      return NextResponse.json({ error: 'No state provided' }, { status: 400 });
    }

    await prisma.gameSave.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, playerName: playerName || session.user.name || 'Player', state },
      update: { state, playerName: playerName || session.user.name || 'Player' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save game state:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE — Reset game for current user
export async function DELETE() {
  try {
    const { auth, prisma } = await getAuthAndPrisma();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await prisma.gameSave.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset game:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
