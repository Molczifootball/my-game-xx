import { getPrisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SAVE_ID = 'default';

// GET — Load game state
export async function GET() {
  try {
    const prisma = getPrisma();
    const save = await prisma.gameSave.findUnique({ where: { id: SAVE_ID } });
    if (!save) {
      return NextResponse.json({ state: null });
    }
    return NextResponse.json({ state: save.state });
  } catch (error) {
    console.error('Failed to load game state:', error);
    return NextResponse.json({ state: null, error: 'Failed to load' }, { status: 500 });
  }
}

// POST — Save game state
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const { state, playerName } = body;

    if (!state) {
      return NextResponse.json({ error: 'No state provided' }, { status: 400 });
    }

    await prisma.gameSave.upsert({
      where: { id: SAVE_ID },
      create: { id: SAVE_ID, playerName: playerName || 'Player_1', state },
      update: { state, playerName: playerName || 'Player_1' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save game state:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE — Reset game
export async function DELETE() {
  try {
    const prisma = getPrisma();
    await prisma.gameSave.deleteMany({ where: { id: SAVE_ID } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset game:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
