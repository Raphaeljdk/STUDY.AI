import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    // Review mode: SM-2 algorithm
    if (body.review !== undefined) {
      const quality = body.review;
      // Quality validation: integer 0-5
      if (typeof quality !== 'number' || !Number.isInteger(quality) || quality < 0 || quality > 5) {
        return NextResponse.json({ error: 'Qualidade invalida' }, { status: 400 });
      }

      const card = await db.flashcard.findFirst({ where: { id, userId } });
      if (!card) {
        return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
      }

      const { easeFactor, interval, repetitions } = card;

      let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      newEF = Math.max(1.3, newEF);

      let newInterval: number;
      let newRepetitions: number;

      if (quality < 3) {
        newRepetitions = 0;
        newInterval = 1;
      } else {
        newRepetitions = repetitions + 1;
        if (newRepetitions === 1) newInterval = 1;
        else if (newRepetitions === 2) newInterval = 6;
        else newInterval = Math.round(interval * newEF);
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
      const nextReviewISO = nextReview.toISOString();

      // TOCTOU-safe updateMany with userId filter
      const result = await db.flashcard.updateMany({
        where: { id, userId },
        data: {
          easeFactor: newEF,
          interval: newInterval,
          repetitions: newRepetitions,
          nextReview: nextReviewISO,
          updatedAt: nowISO(),
        },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
      }

      const updated = await db.flashcard.findFirst({ where: { id, userId } });
      return NextResponse.json({ flashcard: updated });
    }

    // Edit mode
    const { front, back, notebookId } = body;
    const data: any = { updatedAt: nowISO() };

    if (typeof front === 'string') {
      if (!front.trim()) {
        return NextResponse.json({ error: 'Frente nao pode ser vazia' }, { status: 400 });
      }
      data.front = front.trim();
    }
    if (typeof back === 'string') {
      if (!back.trim()) {
        return NextResponse.json({ error: 'Verso nao pode ser vazio' }, { status: 400 });
      }
      data.back = back.trim();
    }
    if (notebookId === null) {
      data.notebookId = null;
    } else if (notebookId !== undefined) {
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
      data.notebookId = notebookId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 });
    }

    // TOCTOU-safe updateMany with userId filter
    const result = await db.flashcard.updateMany({
      where: { id, userId },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
    }

    const flashcard = await db.flashcard.findFirst({ where: { id, userId } });
    return NextResponse.json({ flashcard });
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
    const result = await db.flashcard.deleteMany({ where: { id, userId } });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
