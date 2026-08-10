import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

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

    const subjects = db.subject.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });

    // Manually add _count (was include: { _count: { select: { topics: true, tasks: true } } })
    const subjectsWithCount = subjects.map((s: any) => ({
      ...s,
      _count: {
        topics: db.topic.count({ where: { subjectId: s.id } }),
        tasks: db.task.count({ where: { subjectId: s.id } }),
      },
    }));

    return NextResponse.json({ subjects: subjectsWithCount });
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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
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

    const subject = db.subject.create({
      data: {
        id: genId(),
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        color: typeof color === 'string' && color ? color : '#6366f1',
        icon: typeof icon === 'string' && icon ? icon : 'book',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        userId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
