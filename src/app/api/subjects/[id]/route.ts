import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const subject = db.subject.findFirst({
      where: { id, userId },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 404 });
    }

    // Separate queries for _count and topics (was include)
    const topics = db.topic.findMany({
      where: { subjectId: id },
      orderBy: { sortOrder: 'asc' },
    });

    const _count = {
      topics: db.topic.count({ where: { subjectId: id } }),
      tasks: db.task.count({ where: { subjectId: id } }),
      goals: db.goal.count({ where: { subjectId: id } }),
      sessions: db.studySession.count({ where: { subjectId: id } }),
    };

    return NextResponse.json({ subject: { ...subject, topics, _count } });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const existing = db.subject.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { name, description, color, icon, sortOrder, isActive } = body;

    const data: any = { updatedAt: nowISO() };
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (typeof color === 'string' && color) data.color = color;
    if (typeof icon === 'string' && icon) data.icon = icon;
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder;
    if (typeof isActive === 'boolean') data.isActive = isActive ? 1 : 0;

    const subject = db.subject.update({
      where: { id },
      data,
    });

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const existing = db.subject.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 404 });
    }

    db.subject.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
