import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { preTestId, answers } = body;

    if (!preTestId || typeof preTestId !== 'string') {
      return NextResponse.json({ error: 'ID do pre-teste obrigatorio' }, { status: 400 });
    }
    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: 'Respostas obrigatorias (array)' }, { status: 400 });
    }

    const preTest = await db.preTest.findFirst({ where: { id: preTestId, userId } });
    if (!preTest) {
      return NextResponse.json({ error: 'Pre-teste nao encontrado' }, { status: 404 });
    }
    if (preTest.completedAt) {
      return NextResponse.json({ error: 'Pre-teste ja finalizado' }, { status: 400 });
    }

    // Parse questions
    let questions: any[];
    try {
      questions = JSON.parse(preTest.questions);
    } catch {
      return NextResponse.json({ error: 'Dados do pre-teste corrompidos' }, { status: 500 });
    }

    // Calculate score
    let correct = 0;
    const results = questions.map((q: any, idx: number) => {
      const userAnswer = answers[idx] ?? null;
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) correct++;
      return {
        questionIndex: idx,
        userAnswer,
        correctAnswer: q.correctIndex,
        isCorrect,
      };
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    const updatedPreTest = await db.preTest.update({
      where: { id: preTestId },
      data: {
        initialScore: score,
        finalScore: score,
        answers: JSON.stringify(answers),
        completedAt: new Date(),
      },
    });

    // Update user total questions answered
    await db.user.update({
      where: { id: userId },
      data: { totalQuestionsAnswered: { increment: questions.length } },
    });

    return NextResponse.json({
      preTest: updatedPreTest,
      score,
      correct,
      total: questions.length,
      results,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
