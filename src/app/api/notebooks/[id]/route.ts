import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    // Verify user exists in DB
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }
    const { id } = await params;

    const notebook = await db.notebook.findFirst({
      where: { id, userId },
      include: { flashcards: { orderBy: { createdAt: 'desc' } } },
    });

    if (!notebook) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ notebook });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    // Verify user exists in DB
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }
    const { id } = await params;

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }
    const { title, content, color } = body;

    const data: any = {};
    if (typeof title === 'string') data.title = title.trim();
    if (typeof content === 'string') data.content = content;
    if (typeof color === 'string') data.color = color;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 });
    }

    // TOCTOU-safe updateMany with userId filter
    const result = await db.notebook.updateMany({
      where: { id, userId },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    const notebook = await db.notebook.findFirst({ where: { id, userId } });
    return NextResponse.json({ notebook });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    // Verify user exists in DB
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }
    const { id } = await params;

    // TOCTOU-safe deleteMany with userId filter
    const result = await db.notebook.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
