import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { canAccess, FEATURE_MIN_PLAN } from '@/lib/plan-gating';
import { db, genId, nowISO, sqlite } from '@/lib/db';
import { aiChat } from '@/lib/zai';

// GET /api/teach - fetch teaching history
export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'teach')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['teach'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    const teachings = await db.chatMessage.findMany({
      where: {
        userId,
        role: 'teaching',
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: ['id', 'content', 'createdAt'],
    });

    return NextResponse.json({ teachings });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/teach - analyze user explanation
export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'teach')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['teach'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { topic, explanation, subject, difficulty } = body;

    if (!topic || !explanation) {
      return NextResponse.json({ error: 'Topico e explicacao sao obrigatorios' }, { status: 400 });
    }

    if (explanation.trim().length < 20) {
      return NextResponse.json({ error: 'Explicacao muito curta. Explique com mais detalhes.' }, { status: 400 });
    }

    // Get user's subjects (no include — separate queries)
    const subjects = await db.subject.findMany({
      where: { userId },
      take: 10,
    });

    // Get topics for each subject separately
    const subjectsWithTopics = await Promise.all(subjects.map(async s => {
      const topicWhere: any = { subjectId: s.id };
      if (topic) topicWhere.name = { contains: topic };
      const topics = await db.topic.findMany({
        where: topicWhere,
        select: ['name', 'mastery'],
        take: 5,
      });
      return { ...s, topics };
    }));

    const relatedTopics = subjectsWithTopics.flatMap(s => s.topics).filter(t => t.name.toLowerCase().includes(topic.toLowerCase()));

    // Fetch notebook pages related to the topic/subject
    let notebookContext = '';
    let notebookNoteCount = 0;
    try {
      // Strategy 1: Find notebooks via tags matching the subject
      let relevantNotebookIds: string[] = [];
      if (subject) {
        const matchingTags = await db.notebookTag.findMany({
          where: {
            userId,
            name: { contains: subject },
          },
          select: ['notebookId'],
        });
        relevantNotebookIds = matchingTags.map((t: any) => t.notebookId);
      }

      // Strategy 2: Find notebooks by title matching subject or topic
      const allUserNotebooks = await db.notebook.findMany({
        where: { userId },
        select: ['id', 'title'],
      });

      const titleMatched = allUserNotebooks.filter((nb: any) => {
        if (!subject && !topic) return false;
        const titleLower = (nb.title || '').toLowerCase();
        const matched = (
          (subject && titleLower.includes(subject.toLowerCase())) ||
          (topic && titleLower.includes(topic.toLowerCase()))
        );
        return matched && !relevantNotebookIds.includes(nb.id);
      });

      const allRelevantNotebooks = [
        ...allUserNotebooks.filter((nb: any) => relevantNotebookIds.includes(nb.id)),
        ...titleMatched,
      ].slice(0, 3);

      for (const nb of allRelevantNotebooks) {
        const pages = await db.notebookPage.findMany({
          where: {
            notebookId: nb.id,
            textContent: { not: '' },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: ['textContent', 'pageNumber'],
        });
        if (pages.length > 0) {
          notebookContext += `\nCaderno "${nb.title}":\n`;
          notebookContext += pages
            .map((p: any) => `Pagina ${p.pageNumber}: ${(p.textContent || '').substring(0, 500)}`)
            .join('\n---\n');
          notebookNoteCount += pages.length;
        }
      }
    } catch (err) {
      console.warn('[Teach] Error fetching notebook context:', err);
    }

    const difficultyLabel = difficulty === 'basico' ? 'basico'
      : difficulty === 'intermediario' ? 'intermediario'
      : difficulty === 'avancado' ? 'avancado'
      : 'intermediario';

    // AI analysis
    const contextStr = relatedTopics.length > 0
      ? `O usuario ja tem registro de estudo em topicos relacionados: ${relatedTopics.map(t => `${t.name} (${t.mastery}% dominio)`).join(', ')}.`
      : 'Nenhum registro anterior de estudo deste topico.';

    const notebookStr = notebookContext
      ? `\n\nNotas do aluno nos cadernos do app (use para contextualizar a avaliacao e verificar se a explicacao condiz com o que o aluno anotou):\n${notebookContext}`
      : '\n\nNotas do aluno nos cadernos do app: Nenhuma nota encontrada para esta materia.';

    const aiResponse = await aiChat([
      {
        role: 'system',
        content: `Voce e um professor universitario rigoroso mas encorajador. Um aluno esta tentando explicar um conceito para voce como se ele fosse o professor. Seu trabalho e avaliar a precisao, profundidade e clareza da explicacao.

Avalie considerando o nivel de dificuldade: ${difficultyLabel}.

${contextStr}
${notebookStr}

IMPORTANTE: Se o aluno tiver notas em cadernos, compare a explicacao dele com o que ele anotou. Se a explicacao for diferente das notas, note isso como ponto de atencao. Se as notas forem usadas como base, elogie.

Responda APENAS com um JSON valido (sem markdown, sem code fences) com estes campos:
{
  "mastery": 0-100,
  "precision": 0-100,
  "depth": 0-100,
  "clarity": 0-100,
  "completeness": 0-100,
  "overallGrade": "A"|"B"|"C"|"D"|"F",
  "summary": "resumo de 1-2 frases sobre a explicacao do aluno",
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
  "corrections": ["correcao 1 com detalhes", "correcao 2 com detalhes"],
  "suggestions": ["sugestao de melhoria 1", "sugestao de melhoria 2"],
  "questionsToExplore": ["pergunta para aprofundar 1", "pergunta para aprofundar 2"],
  "nextTopics": ["proximo topico recomendado 1", "proximo topico recomendado 2"],
  "encouragement": "frase motivadora personalizada",
  "improvementSteps": ["passo 1 para melhorar - acao concreta", "passo 2 para melhorar - acao concreta", "passo 3 para melhorar - acao concreta"],
  "relatedTopicsToStudy": ["topico relacionado 1 para estudar", "topico relacionado 2 para estudar"]
}

Seja justo mas exigente. Nao aceite explicacoes vagas ou superficiais. Elogie sinceramente quando merecido. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Topico: "${topic}"
Materia: ${subject || 'Geral'}
Nivel: ${difficultyLabel}

Explicacao do aluno:
"""
${explanation}
"""

Avalie esta explicacao como se eu estivesse ensinando este conceito para voce.`,
      },
    ]);

    let analysis: any = null;
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        error: 'Erro ao analisar a explicacao. Tente novamente.',
        rawResponse: aiResponse,
      }, { status: 500 });
    }

    // Award XP based on mastery
    const xpEarned = Math.round((analysis.mastery || 0) / 10);
    const totalXP = Math.max(5, Math.min(25, xpEarned));

    // Update user XP if earned (increment via raw SQL)
    if (totalXP > 0) {
      await sqlite.execute({ sql: 'UPDATE "User" SET "xp" = "xp" + $1, "totalQuestionsAnswered" = "totalQuestionsAnswered" + $2, "updatedAt" = $3 WHERE "id" = $4', args: [totalXP, 1, nowISO(), userId] });

      // Create XP transaction
      await db.xpTransaction.create({
        data: {
          id: genId(),
          userId,
          amount: totalXP,
          source: 'QUIZ_COMPLETED',
          description: `Ensinar "${topic}" - nota ${analysis.overallGrade || '?'}`,
          createdAt: nowISO(),
        },
      });

      // Update related topic mastery if exists
      if (relatedTopics.length > 0) {
        // Find topic in database by name match
        for (const rel of relatedTopics) {
          const dbTopic = await db.topic.findFirst({
            where: { name: rel.name },
          });
          if (dbTopic && (analysis.mastery || 0) > dbTopic.mastery) {
            await db.topic.update({
              where: { id: dbTopic.id },
              data: { mastery: analysis.mastery || 0, updatedAt: nowISO() },
            });
          }
        }
      }
    }

    // Save teaching session as memory
    await db.chatMessage.create({
      data: {
        id: genId(),
        userId,
        role: 'teaching',
        content: JSON.stringify({
          topic,
          subject: subject || null,
          difficulty: difficultyLabel,
          explanation: explanation.substring(0, 500),
          mastery: analysis.mastery,
          grade: analysis.overallGrade,
          xpEarned: totalXP,
        }),
        createdAt: nowISO(),
      },
    });

    // Recalculate level
    const updatedUser = await db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });
    if (updatedUser) {
      const newLevel = Math.floor(updatedUser.xp / 500) + 1;
      if (newLevel > updatedUser.level) {
        await db.user.update({ where: { id: userId }, data: { level: newLevel, updatedAt: nowISO() } });
      }
    }

    return NextResponse.json({
      analysis,
      xpEarned: totalXP,
      topic,
      subject,
      notebookNoteCount,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}