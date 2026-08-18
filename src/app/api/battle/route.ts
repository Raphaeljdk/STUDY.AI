import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'battle');
    if (denied) return denied;
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
    const denied = requirePlan(user, 'battle');
    if (denied) return denied;
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

    // Generate questions with AI (JSON mode for reliable parsing)
    const aiResponse = await aiChatJSON([
      {
        role: 'system',
        content: `Voce e um professor que cria questoes de quiz educacional. Gere ${numQuestions} questoes de multipla escolha sobre "${subject.trim()}". Responda APENAS com um JSON valido no formato: { "questions": [ { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0, "explanation": "explicacao curta" } ] }. A "correctIndex" e o indice (0-3) da opcao correta. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Crie ${numQuestions} questoes sobre ${subject.trim()}.`,
      },
    ], { maxTokens: 4096, temperature: 0.6 });

    const parsed = safeParseJSON(aiResponse);
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: 'A IA nao conseguiu gerar questoes validas. Tente novamente.' }, { status: 500 });
    }

    const questions = parsed.questions.slice(0, numQuestions);

    const battle = await db.battle.create({
      data: {
        id: genId(),
        userId,
        subject: subject.trim(),
        topic: subject.trim(),
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
    console.error('[Battle POST] Route error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('GROQ_API_KEY')) {
      return NextResponse.json({ error: 'Servidor de IA nao configurado. Contate o suporte.' }, { status: 503 });
    }
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'A IA demorou demais para responder. Tente novamente.' }, { status: 503 });
    }
    if (msg.includes('429') || msg.includes('rate')) {
      return NextResponse.json({ error: 'Muitas requisicoes. Aguarde alguns segundos e tente novamente.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor. Tente novamente.' }, { status: 500 });
  }
}
