import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { auth as nextAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const MAX_CONTENT_LENGTH = 280;

export async function GET() {
  try {
    const prisma = getPrisma();
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { premiumUntil: true }
        }
      }
    });
    return NextResponse.json({ messages: messages.reverse() });
  } catch (e) {
    console.error('Chat GET error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const session = await nextAuth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    if (content.length > MAX_CONTENT_LENGTH) return NextResponse.json({ error: 'Too long' }, { status: 400 });

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        authorName: session.user.name || 'Unknown',
      }
    });

    return NextResponse.json({ message });
  } catch (e) {
    console.error('Chat POST error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
