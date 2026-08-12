import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/plan-gating';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const notebooks = await db.notebook.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // Manually add _count.flashcards for each notebook
    const notebooksWithCount = await Promise.all(notebooks.map(async (nb: any) => ({
      ...nb,
      _count: {
        flashcards: await db.flashcard.count({ where: { notebookId: nb.id } }),
      },
    })));

    return NextResponse.json({ notebooks: notebooksWithCount });
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

    const { title, color } = body;

    // Type validation + empty check
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }

    // Plan limit check: FREE users are limited to 3 notebooks
    const plan = (user.plan || 'FREE') as keyof typeof PLAN_LIMITS;
    const notebookLimit = PLAN_LIMITS[plan]?.notebooks;
    if (notebookLimit !== undefined && isFinite(notebookLimit)) {
      const count = await db.notebook.count({ where: { userId } });
      if (count >= notebookLimit) {
        return NextResponse.json({
          error: 'Limite de 3 cadernos atingido no plano gratuito. Upgrade para Samurai!',
          code: 'PLAN_LIMIT',
        }, { status: 403 });
      }
    }

    const notebook = await db.notebook.create({
      data: {
        id: genId(),
        title: title.trim(),
        color: typeof color === 'string' && color ? color : '#c0392b',
        userId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ notebook }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
