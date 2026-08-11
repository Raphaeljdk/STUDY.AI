import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;

    // Verify subject belongs to user
    const subject = await db.subject.findFirst({ where: { id, userId } });
    if (!subject) {
      return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 404 });
    }

    const topics = await db.topic.findMany({
      where: { subjectId: id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;

    // Verify subject belongs to user
    const subject = await db.subject.findFirst({ where: { id, userId } });
    if (!subject) {
      return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { name, description, sortOrder } = body;

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome do topico obrigatorio' }, { status: 400 });
    }

    const topic = await db.topic.create({
      data: {
        id: genId(),
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        subjectId: id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
