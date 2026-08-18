import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db } from '@/lib/db';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'brain');
    if (denied) return denied;
    const userId = user.id;

    // Gather all subject data (no include — separate queries)
    const subjects = await db.subject.findMany({
      where: { userId },
    });

    // Get topics for each subject separately
    const subjectsWithTopics = await Promise.all(subjects.map(async subject => {
      const topics = await db.topic.findMany({
        where: { subjectId: subject.id },
        select: ['id', 'name', 'mastery', 'totalQuestions', 'correctAnswers'],
      });
      const taskCount = await db.task.count({ where: { subjectId: subject.id } });
      return { ...subject, topics, _count: { tasks: taskCount } };
    }));

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
    for (const subject of subjectsWithTopics) {
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
    const allTopics = subjectsWithTopics.flatMap(s => s.topics);
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
    let analysis: any = null;
    try {
      const context = `Materias do usuario: ${JSON.stringify(topicMasteryData)}. Media geral de dominio: ${avgMastery}%. Topicos fracos: ${JSON.stringify(weakTopics)}. Topicos fortes: ${JSON.stringify(strongTopics)}. Media de batalhas recentes: ${battleAvg}%. Media de pre-testes: ${preTestAvg}%. Missoes ativas: ${activeMissions.length}.`;

      const aiResponse = await aiChatJSON([
        {
          role: 'system',
          content: 'Voce e um tutor inteligente que analisa o desempenho do estudante. Com base nos dados fornecidos, gere analises e recomendacoes personalisadas em portugues brasileiro. Responda APENAS com um JSON valido (sem markdown) com: { "summary": "resumo de 2-3 frases do desempenho geral", "weakPoints": [{"topic": "nome", "reason": "motivo", "suggestion": "sugestao de estudo"}], "strengths": [{"topic": "nome", "praise": "elogio"}], "recommendations": [{"priority": "alta/media/baixa", "action": "acao recomendada", "reason": "motivo"}], "nextSteps": ["proximo passo 1", "proximo passo 2", "proximo passo 3"] }. No maximo 5 weakPoints, 3 strengths, 5 recommendations, 3 nextSteps.',
        },
        {
          role: 'user',
          content: `Analise meu desempenho: ${context}`,
        },
      ], { maxTokens: 2000, temperature: 0.5 });

      analysis = safeParseJSON(aiResponse);
    } catch {
      // AI may fail, continue with data-only response
    }

    return NextResponse.json({
      overview: {
        totalSubjects: subjectsWithTopics.length,
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
