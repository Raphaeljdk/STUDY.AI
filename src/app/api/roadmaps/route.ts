import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const roadmaps = db.roadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ roadmaps });
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, topic, steps, isAI } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Topico obrigatorio' }, { status: 400 });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Etapas obrigatorias' }, { status: 400 });
    }

    const roadmap = db.roadmap.create({
      data: {
        id: genId(),
        userId,
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        topic: topic.trim(),
        steps: JSON.stringify(steps),
        totalSteps: steps.length,
        currentStep: 0,
        isAI: (typeof isAI === 'boolean' ? isAI : false) ? 1 : 0,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ roadmap }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
