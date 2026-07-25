import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { id } = await params;
    const body = await request.json();

    // Review mode: SM-2 algorithm
    if (body.review !== undefined) {
      const card = await db.flashcard.findFirst({ where: { id, userId } });
      if (!card) {
        return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
      }

      const quality = body.review; // 0-5
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

      const updated = await db.flashcard.update({
        where: { id },
        data: {
          easeFactor: newEF,
          interval: newInterval,
          repetitions: newRepetitions,
          nextReview,
        },
      });

      return NextResponse.json({ flashcard: updated });
    }

    // Edit mode
    const { front, back, notebookId } = body;
    const data: any = {};
    if (typeof front === 'string') data.front = front.trim();
    if (typeof back === 'string') data.back = back.trim();
    if (notebookId === null || notebookId) data.notebookId = notebookId;

    const existing = await db.flashcard.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
    }

    const flashcard = await db.flashcard.update({ where: { id }, data });
    return NextResponse.json({ flashcard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { id } = await params;

    const existing = await db.flashcard.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Flashcard nao encontrado' }, { status: 404 });
    }

    await db.flashcard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
