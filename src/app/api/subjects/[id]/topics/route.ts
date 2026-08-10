import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify subject belongs to user
    const subject = db.subject.findFirst({ where: { id, userId } });
    if (!subject) {
      return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 404 });
    }

    const topics = db.topic.findMany({
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

    const { id } = await params;

    // Verify subject belongs to user
    const subject = db.subject.findFirst({ where: { id, userId } });
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

    const topic = db.topic.create({
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
