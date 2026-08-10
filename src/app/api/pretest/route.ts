import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';
import { aiChat } from '@/lib/zai';

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const preTests = db.preTest.findMany({
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

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
    const aiResponse = await aiChat([
      {
        role: 'system',
        content: `Voce e um professor que cria avaliacoes diagnosticas. Gere ${questionsCount} questoes de multipla escolha sobre "${topic.trim()}" para um pre-teste (avaliacao inicial). Responda APENAS com um JSON valido (sem markdown) no formato: { "questions": [ { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0 } ] }. A "correctIndex" e o indice (0-3) da opcao correta. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Crie ${questionsCount} questoes de pre-teste sobre ${topic.trim()}.`,
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

    const preTest = db.preTest.create({
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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
