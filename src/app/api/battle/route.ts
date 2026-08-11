import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';
import { aiChat } from '@/lib/zai';

export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const battles = await db.battle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ battles });
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

    const { subject, totalQuestions, duration } = body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Materia obrigatoria' }, { status: 400 });
    }

    const numQuestions = typeof totalQuestions === 'number' && totalQuestions > 0 ? Math.min(totalQuestions, 20) : 5;
    const battleDuration = typeof duration === 'number' ? Math.max(30, Math.min(duration, 300)) : 60;

    // Generate questions with AI
    const aiResponse = await aiChat([
      {
        role: 'system',
        content: `Voce e um professor que cria questoes de quiz educacional. Gere ${numQuestions} questoes de multipla escolha sobre "${subject.trim()}". Responda APENAS com um JSON valido (sem markdown) no formato: { "questions": [ { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0, "explanation": "explicacao curta" } ] }. A "correctIndex" e o indice (0-3) da opcao correta. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Crie ${numQuestions} questoes sobre ${subject.trim()}.`,
      },
    ]);

    let questions: any[];
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      questions = parsed.questions || [];
    } catch {
      return NextResponse.json({ error: 'Erro ao gerar questoes com IA' }, { status: 500 });
    }

    const battle = await db.battle.create({
      data: {
        id: genId(),
        userId,
        subject: subject.trim(),
        totalQuestions: numQuestions,
        duration: battleDuration,
        createdAt: nowISO(),
      },
    });

    return NextResponse.json({
      battle,
      questions,
    }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
