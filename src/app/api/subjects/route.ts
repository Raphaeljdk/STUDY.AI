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
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const subjects = await db.subject.findMany({
      where: { userId },
      include: {
        _count: { select: { topics: true, tasks: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { name, description, color, icon, sortOrder } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 });
    }

    const subject = await db.subject.create({
      data: {
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        color: typeof color === 'string' && color ? color : '#6366f1',
        icon: typeof icon === 'string' && icon ? icon : 'book',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        userId,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
