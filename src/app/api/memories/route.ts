import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const memories = db.userMemory.findMany({
      where: { userId },
      select: ['id', 'category', 'content', 'createdAt'],
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const count = db.userMemory.count({ where: { userId } });

    return NextResponse.json({ memories, count });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
