import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const subjects = await db.subject.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });

    // Manually add _count (was include: { _count: { select: { topics: true, tasks: true } } })
    const subjectsWithCount = await Promise.all(subjects.map(async (s: any) => ({
      ...s,
      _count: {
        topics: await db.topic.count({ where: { subjectId: s.id } }),
        tasks: await db.task.count({ where: { subjectId: s.id } }),
      },
    })));


    return NextResponse.json({ subjects: subjectsWithCount });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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
