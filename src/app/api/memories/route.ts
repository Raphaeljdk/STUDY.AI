import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const memories = await db.userMemory.findMany({
      where: { userId },
      select: ['id', 'category', 'content', 'createdAt'],
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const count = await db.userMemory.count({ where: { userId } });

    return NextResponse.json({ memories, count });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
