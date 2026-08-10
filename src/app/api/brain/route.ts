import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
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
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    // Gather all topic mastery data
    const subjects = await db.subject.findMany({
      where: { userId },
      include: {
        topics: {
          select: { id: true, name: true, mastery: true, totalQuestions: true, correctAnswers: true },
        },
        _count: { select: { tasks: true } },
      },
    });

    // Get recent battle performance
    const recentBattles = await db.battle.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent pre-test scores
    const recentPreTests = await db.preTest.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get active missions
    const activeMissions = await db.mission.findMany({
      where: { userId, status: 'active' },
    });

    // Build topic mastery data for AI
    const topicMasteryData: { topic: string; subject: string; mastery: number; questions: number; accuracy: number }[] = [];
    for (const subject of subjects) {
      for (const topic of subject.topics) {
        topicMasteryData.push({
          topic: topic.name,
          subject: subject.name,
          mastery: topic.mastery,
          questions: topic.totalQuestions,
          accuracy: topic.totalQuestions > 0 ? Math.round((topic.correctAnswers / topic.totalQuestions) * 100) : 0,
        });
      }
    }

    // Calculate averages
    const allTopics = subjects.flatMap(s => s.topics);
    const avgMastery = allTopics.length > 0
      ? Math.round(allTopics.reduce((sum, t) => sum + t.mastery, 0) / allTopics.length)
      : 0;

    const weakTopics = topicMasteryData
      .filter(t => t.mastery < 40)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5);

    const strongTopics = topicMasteryData
      .filter(t => t.mastery >= 70)
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 5);

    // Battle avg
    const totalBattleQ = recentBattles.reduce((sum, b) => sum + b.totalQuestions, 0);
    const battleAvg = recentBattles.length > 0 && totalBattleQ > 0
      ? Math.round(recentBattles.reduce((sum, b) => sum + b.correctAnswers, 0) / totalBattleQ * 100)
      : null;

    // Pre-test avg
    const preTestAvg = recentPreTests.length > 0
      ? Math.round(recentPreTests.reduce((sum, p) => sum + (p.initialScore || 0), 0) / recentPreTests.length)
      : null;

    // Generate AI recommendations
    let aiRecommendations: string | null = null;
    try {
      const context = `Materias do usuario: ${JSON.stringify(topicMasteryData)}. Media geral de dominio: ${avgMastery}%. Topicos fracos: ${JSON.stringify(weakTopics)}. Topicos fortes: ${JSON.stringify(strongTopics)}. Media de batalhas recentes: ${battleAvg}%. Media de pre-testes: ${preTestAvg}%. Missoes ativas: ${activeMissions.length}.`;

      aiRecommendations = await aiChat([
        {
          role: 'system',
          content: 'Voce e um tutor inteligente que analisa o desempenho do estudante. Com base nos dados fornecidos, gere analises e recomendacoes personalisadas em portugues brasileiro. Responda APENAS com um JSON valido (sem markdown) com: { "summary": "resumo de 2-3 frases do desempenho geral", "weakPoints": [{"topic": "nome", "reason": "motivo", "suggestion": "sugestao de estudo"}], "strengths": [{"topic": "nome", "praise": "elogio"}], "recommendations": [{"priority": "alta/media/baixa", "action": "acao recomendada", "reason": "motivo"}], "nextSteps": ["proximo passo 1", "proximo passo 2", "proximo passo 3"] }. No maximo 5 weakPoints, 3 strengths, 5 recommendations, 3 nextSteps.',
        },
        {
          role: 'user',
          content: `Analise meu desempenho: ${context}`,
        },
      ]);
    } catch {
      // AI may fail, continue with data-only response
    }

    let analysis: any = null;
    if (aiRecommendations) {
      try {
        const jsonStr = aiRecommendations.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(jsonStr);
      } catch {
        // ignore parse errors
      }
    }

    return NextResponse.json({
      overview: {
        totalSubjects: subjects.length,
        totalTopics: allTopics.length,
        avgMastery,
        activeMissions: activeMissions.length,
        recentBattleAvg: battleAvg,
        recentPreTestAvg: preTestAvg,
      },
      weakTopics,
      strongTopics,
      topicMastery: topicMasteryData,
      analysis,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
