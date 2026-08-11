import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;

    const notebook = await db.notebook.findFirst({
      where: { id, userId },
    });

    if (!notebook) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    // Separate query for flashcards (was include)
    const flashcards = await db.flashcard.findMany({
      where: { notebookId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notebook: { ...notebook, flashcards } });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }
    const { title, content, color } = body;

    const data: any = { updatedAt: nowISO() };
    if (typeof title === 'string') data.title = title.trim();
    if (typeof content === 'string') data.content = content;
    if (typeof color === 'string') data.color = color;

    if (Object.keys(data).length === 1) {
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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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
