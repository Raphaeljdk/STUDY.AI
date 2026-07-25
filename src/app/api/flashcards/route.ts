import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida. Tente fazer login novamente.' }, { status: 401 });
    }
    // Verify user exists in DB
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado. Crie uma nova conta.' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const notebookId = searchParams.get('notebookId');
    const dueOnly = searchParams.get('due') === 'true';

    const where: any = { userId };
    if (notebookId) where.notebookId = notebookId;
    if (dueOnly) where.nextReview = { lte: new Date() };

    const flashcards = await db.flashcard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ flashcards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: 'Sessao invalida. Tente fazer login novamente.' }, { status: 401 });
    }
    // Verify user exists in DB
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado. Crie uma nova conta.' }, { status: 401 });
    }
    const { front, back, notebookId } = await request.json();

    if (!front || !back) {
      return NextResponse.json({ error: 'Frente e verso obrigatorios' }, { status: 400 });
    }

    const flashcard = await db.flashcard.create({
      data: { front: front.trim(), back: back.trim(), notebookId: notebookId || null, userId },
    });

    return NextResponse.json({ flashcard }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
