import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const preTests = await db.preTest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ preTests });
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

    const { topic, subjectId, numQuestions } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Topico obrigatorio' }, { status: 400 });
    }

    const questionsCount = typeof numQuestions === 'number' && numQuestions > 0 ? Math.min(numQuestions, 20) : 5;

    // Generate questions with AI
    const aiResponse = await aiChatJSON([
      {
        role: 'system',
        content: `Voce e um professor que cria avaliacoes diagnosticas. Gere ${questionsCount} questoes de multipla escolha sobre "${topic.trim()}" para um pre-teste (avaliacao inicial). Responda APENAS com um JSON valido (sem markdown) no formato: { "questions": [ { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0 } ] }. A "correctIndex" e o indice (0-3) da opcao correta. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Crie ${questionsCount} questoes de pre-teste sobre ${topic.trim()}.`,
      },
    ], { maxTokens: 3000, temperature: 0.5 });

    const parsed = safeParseJSON(aiResponse);
    if (!parsed || !Array.isArray(parsed.questions)) {
      return NextResponse.json({ error: 'Erro ao gerar questoes com IA' }, { status: 500 });
    }
    const questions = parsed.questions;

    const preTest = await db.preTest.create({
      data: {
        id: genId(),
        userId,
        topic: topic.trim(),
        subjectId: typeof subjectId === 'string' && subjectId ? subjectId : null,
        initialScore: 0,
        questions: JSON.stringify(questions),
        createdAt: nowISO(),
      },
    });

    return NextResponse.json({
      preTest,
      questions,
    }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('GROQ_API_KEY')) {
      return NextResponse.json({ error: 'Servidor de IA indisponivel. Tente novamente em alguns segundos.' }, { status: 503 });
    }
    if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Servidor de IA indisponivel. Tente novamente em alguns segundos.' }, { status: 503 });
    }
    if (msg.includes('429')) {
      return NextResponse.json({ error: 'Muitas requisicoes. Aguarde um momento e tente novamente.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
