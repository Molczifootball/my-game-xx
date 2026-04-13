import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { auth as nextAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await nextAuth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // 1. Authorization: Email or isAdmin
    let user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    // Auto-elevate the specific email (Fall-back if CLI failed)
    if (user?.email === 'molczanpat@gmail.com' && !user.isAdmin) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true }
      });
    }

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    // 2. Fetch Dashboard Statistics
    const totalUsers = await prisma.user.count();
    const totalVillages = await prisma.worldTile.count({ where: { type: 'player' } });
    const activeCommands = await prisma.combatCommand.count();
    
    // Logged in users (Users with non-expired sessions)
    const now = new Date();
    const activeSessions = await prisma.session.findMany({
      where: { expires: { gt: now } },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      distinct: ['userId']
    });
    
    // Bug reports
    const bugs = await prisma.bugReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      stats: { totalUsers, totalVillages, activeCommands, onlineNow: activeSessions.length },
      onlineUsers: activeSessions.map(s => s.user),
      bugs
    });

  } catch (error) {
    console.error('Admin API ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await nextAuth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    const { action, bugId } = await req.json();
    if (!bugId) return NextResponse.json({ error: 'Bug ID is required' }, { status: 400 });

    if (action === 'delete') {
      await prisma.bugReport.delete({ where: { id: bugId } });
    } else if (action === 'markDone') {
      await prisma.bugReport.update({ where: { id: bugId }, data: { status: 'done' } });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POST API ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
