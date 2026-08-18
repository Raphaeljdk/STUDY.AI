import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db, genId, nowISO, sqlite } from '@/lib/db';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

// GET /api/teach - fetch teaching history
export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'teach');
    if (denied) return denied;
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
    console.error('[Teach GET] Route error:', error);
    return NextResponse.json({ error: 'Erro ao carregar historico' }, { status: 500 });
  }
}

// POST /api/teach - analyze user explanation
export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'teach');
    if (denied) return denied;
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

    // Get user's subjects
    let relatedTopics: any[] = [];
    try {
      const subjects = await db.subject.findMany({ where: { userId }, take: 10 });
      const subjectsWithTopics = await Promise.all(subjects.map(async (s: any) => {
        const topicWhere: any = { subjectId: s.id };
        if (topic) topicWhere.name = { contains: topic };
        const topics = await db.topic.findMany({ where: topicWhere, select: ['name', 'mastery'], take: 5 });
        return { ...s, topics };
      }));
      relatedTopics = subjectsWithTopics.flatMap((s: any) => s.topics).filter((t: any) => t.name.toLowerCase().includes(topic.toLowerCase()));
    } catch (err) {
      console.warn('[Teach] Error fetching topics:', err);
    }

    // Fetch notebook pages related to the topic/subject
    let notebookContext = '';
    let notebookNoteCount = 0;
    try {
      let relevantNotebookIds: string[] = [];
      if (subject) {
        const matchingTags = await db.notebookTag.findMany({
          where: { userId, name: { contains: subject } },
          select: ['notebookId'],
        });
        relevantNotebookIds = matchingTags.map((t: any) => t.notebookId);
      }

      const allUserNotebooks = await db.notebook.findMany({
        where: { userId },
        select: ['id', 'title'],
      });

      const titleMatched = allUserNotebooks.filter((nb: any) => {
        if (!subject && !topic) return false;
        const titleLower = (nb.title || '').toLowerCase();
        return (
          ((subject && titleLower.includes(subject.toLowerCase())) ||
          (topic && titleLower.includes(topic.toLowerCase()))) &&
          !relevantNotebookIds.includes(nb.id)
        );
      });

      const allRelevantNotebooks = [
        ...allUserNotebooks.filter((nb: any) => relevantNotebookIds.includes(nb.id)),
        ...titleMatched,
      ].slice(0, 3);

      for (const nb of allRelevantNotebooks) {
        // Use raw query to avoid potential issues with { not: '' } operator
        const pages = await db.notebookPage.query(
          `SELECT "textContent", "pageNumber" FROM "NotebookPage" WHERE "notebookId" = $1 AND "textContent" != '' ORDER BY "createdAt" DESC LIMIT 5`,
          nb.id
        );
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

    const contextStr = relatedTopics.length > 0
      ? `O usuario ja estudou: ${relatedTopics.map((t: any) => `${t.name} (${t.mastery}% dominio)`).join(', ')}.`
      : 'Nenhum registro anterior.';

    const notebookStr = notebookContext
      ? `\n\nNotas do aluno:\n${notebookContext}`
      : '\n\nNotas do aluno: Nenhuma nota encontrada.';

    // AI analysis with JSON mode for reliable parsing
    const aiResponse = await aiChatJSON([
      {
        role: 'system',
        content: `Voce e um professor universitario que avalia explicacoes de alunos.
Nivel de dificuldade: ${difficultyLabel}.
${contextStr}${notebookStr}

Responda com JSON contendo:
{
  "mastery": 0-100,
  "precision": 0-100,
  "depth": 0-100,
  "clarity": 0-100,
  "completeness": 0-100,
  "overallGrade": "A"|"B"|"C"|"D"|"F",
  "summary": "resumo de 1-2 frases",
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
  "corrections": ["correcao 1", "correcao 2"],
  "suggestions": ["sugestao 1", "sugestao 2"],
  "questionsToExplore": ["pergunta 1", "pergunta 2"],
  "nextTopics": ["topico 1", "topico 2"],
  "encouragement": "frase motivadora",
  "improvementSteps": ["passo 1", "passo 2", "passo 3"],
  "relatedTopicsToStudy": ["topico 1", "topico 2"]
}

Seja justo mas exigente. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Topico: "${topic}"\nMateria: ${subject || 'Geral'}\nNivel: ${difficultyLabel}\n\nExplicacao:\n"""\n${explanation}\n"""\n\nAvalie esta explicacao.`,
      },
    ], { maxTokens: 4096, temperature: 0.5 });

    const analysis = safeParseJSON(aiResponse);
    if (!analysis || typeof analysis.mastery !== 'number') {
      return NextResponse.json({
        error: 'A IA nao conseguiu gerar uma analise valida. Tente novamente com uma explicacao mais detalhada.',
      }, { status: 500 });
    }

    // Award XP
    const xpEarned = Math.round((analysis.mastery || 0) / 10);
    const totalXP = Math.max(5, Math.min(25, xpEarned));

    if (totalXP > 0) {
      try {
        await sqlite.execute({ sql: 'UPDATE "User" SET "xp" = "xp" + $1, "totalQuestionsAnswered" = "totalQuestionsAnswered" + $2, "updatedAt" = $3 WHERE "id" = $4', args: [totalXP, 1, nowISO(), userId] });
      } catch (xpErr) {
        console.warn('[Teach] Error updating XP:', xpErr);
      }

      try {
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
      } catch (xpTxErr) {
        console.warn('[Teach] Error creating XP transaction:', xpTxErr);
      }

      // Update related topic mastery
      if (relatedTopics.length > 0) {
        for (const rel of relatedTopics) {
          try {
            const dbTopic = await db.topic.findFirst({ where: { name: (rel as any).name } });
            if (dbTopic && (analysis.mastery || 0) > dbTopic.mastery) {
              await db.topic.update({ where: { id: dbTopic.id }, data: { mastery: analysis.mastery || 0, updatedAt: nowISO() } });
            }
          } catch { /* skip individual topic updates */ }
        }
      }
    }

    // Save teaching session
    try {
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
    } catch (saveErr) {
      console.warn('[Teach] Error saving session:', saveErr);
    }

    // Recalculate level
    try {
      const updatedUser = await db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });
      if (updatedUser) {
        const newLevel = Math.floor(updatedUser.xp / 500) + 1;
        if (newLevel > updatedUser.level) {
          await db.user.update({ where: { id: userId }, data: { level: newLevel, updatedAt: nowISO() } });
        }
      }
    } catch { /* non-critical */ }

    return NextResponse.json({
      analysis,
      xpEarned: totalXP,
      topic,
      subject,
      notebookNoteCount,
    });
  } catch (error) {
    console.error('[Teach POST] Route error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('GROQ_API_KEY')) {
      return NextResponse.json({ error: 'Servidor de IA nao configurado. Contate o suporte.' }, { status: 503 });
    }
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'A IA demorou demais. Tente novamente.' }, { status: 503 });
    }
    if (msg.includes('429') || msg.includes('rate')) {
      return NextResponse.json({ error: 'Muitas requisicoes. Aguarde e tente novamente.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor. Tente novamente.' }, { status: 500 });
  }
}
