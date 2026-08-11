import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const notebookId = searchParams.get('notebookId');
    const dueOnly = searchParams.get('due') === 'true';

    const where: any = { userId };
    if (notebookId) {
      // Cross-user notebook injection fix: verify ownership
      const ownedNotebook = await db.notebook.findFirst({
        where: { id: notebookId, userId },
        select: ['id'],
      });
      if (!ownedNotebook) {
        return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
      }
      where.notebookId = notebookId;
    }
    if (dueOnly) where.nextReview = { lte: new Date().toISOString() };

    const flashcards = await db.flashcard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ flashcards });
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

    // JSON parse safety
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { front, back, notebookId } = body;

    // Type validation + trim check
    if (typeof front !== 'string' || !front.trim() || typeof back !== 'string' || !back.trim()) {
      return NextResponse.json({ error: 'Frente e verso obrigatorios' }, { status: 400 });
    }

    let finalNotebookId: string | null = null;
    if (notebookId !== undefined && notebookId !== null) {
      if (typeof notebookId !== 'string' || !notebookId.trim()) {
        return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
      }
      // Cross-user notebook injection fix
      const ownedNotebook = await db.notebook.findFirst({
        where: { id: notebookId, userId },
        select: ['id'],
      });
      if (!ownedNotebook) {
        return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
      }
      finalNotebookId = notebookId;
    }

    const flashcard = await db.flashcard.create({
      data: { id: genId(), front: front.trim(), back: back.trim(), notebookId: finalNotebookId, userId, createdAt: nowISO(), updatedAt: nowISO() },
    });

    return NextResponse.json({ flashcard }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
