import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

export async function GET(_request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'missions');
    if (denied) return denied;
    const userId = user.id;

    const missions = await db.mission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Transform DB fields to match frontend Mission interface
    const transformed = missions.map((m: any) => {
      let parsedSteps: any[] = [];
      try {
        parsedSteps = typeof m.steps === 'string' ? JSON.parse(m.steps) : (Array.isArray(m.steps) ? m.steps : []);
      } catch {
        parsedSteps = [];
      }

      return {
        id: m.id,
        title: m.title || '',
        subject: m.subject || '',
        topic: m.topic || '',
        totalTimeMinutes: m.estimatedMinutes || 0,
        xpReward: m.xpReward || 0,
        completedSteps: m.completedSteps || 0,
        totalSteps: m.totalSteps || 0,
        steps: parsedSteps,
        status: m.completedAt ? 'completed' : (m.status || 'active'),
        currentMastery: m.startMastery || 0,
        targetMastery: m.endMastery || 0,
        createdAt: m.createdAt || '',
        completedAt: m.completedAt || null,
        beforeMastery: m.startMastery || 0,
      };
    });

    return NextResponse.json({ missions: transformed });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'missions');
    if (denied) return denied;
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { subject, topic, timeAvailable, title, description, steps, estimatedMinutes, xpReward, generateWithAI } = body;

    // Detect AI generation
    const isAIGeneration = generateWithAI || (subject && topic && timeAvailable);

    if (isAIGeneration) {
      const subjectStr = typeof subject === 'string' ? subject : 'estudos gerais';
      const topicStr = typeof topic === 'string' ? topic : 'topico geral';
      const timeAvail = typeof timeAvailable === 'number' ? timeAvailable : (typeof estimatedMinutes === 'number' ? estimatedMinutes : 30);

      const aiResponse = await aiChatJSON([
        {
          role: 'system',
          content: `Voce e um professor que cria missoes de estudo estruturadas em portugues brasileiro. Crie uma missao sobre "${subjectStr}" foco em "${topicStr}". Tempo: ${timeAvail} minutos.

Responda com JSON:
- title: titulo criativo
- description: descricao curta
- subject: materia
- steps: array com 3-6 objetos, cada um com: id ("step_1"...), title, emoji, durationMinutes (number), completed (false), description

Soma de durationMinutes = ~${timeAvail} minutos.`,
        },
        {
          role: 'user',
          content: `Crie missao: ${subjectStr} - ${topicStr}, ${timeAvail} minutos.`,
        },
      ], { maxTokens: 3072, temperature: 0.6 });

      const aiData = safeParseJSON(aiResponse);
      if (!aiData || !Array.isArray(aiData.steps) || aiData.steps.length === 0) {
        return NextResponse.json({ error: 'A IA nao conseguiu gerar uma missao valida. Tente novamente.' }, { status: 500 });
      }

      const stepsArr = aiData.steps;
      const totalMinutes = stepsArr.reduce((sum: number, s: any) => sum + (typeof s.durationMinutes === 'number' ? s.durationMinutes : 0), 0);

      const created = await db.mission.create({
        data: {
          id: genId(),
          userId,
          title: aiData.title || 'Missao gerada',
          description: aiData.description || null,
          subject: subjectStr,
          topic: topicStr,
          steps: JSON.stringify(stepsArr),
          totalSteps: stepsArr.length,
          completedSteps: 0,
          startMastery: 0,
          endMastery: 0,
          estimatedMinutes: totalMinutes > 0 ? totalMinutes : timeAvail,
          xpReward: 100,
          status: 'active',
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
      });

      const result = {
        id: created.id,
        title: created.title,
        subject: created.subject,
        topic: topicStr,
        totalTimeMinutes: totalMinutes > 0 ? totalMinutes : timeAvail,
        xpReward: 100,
        completedSteps: 0,
        totalSteps: stepsArr.length,
        steps: stepsArr,
        status: 'active',
        currentMastery: 0,
        targetMastery: 0,
        createdAt: created.createdAt,
        completedAt: null,
        beforeMastery: 0,
      };

      return NextResponse.json({ mission: result }, { status: 201 });
    }

    // Manual creation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Etapas obrigatorias' }, { status: 400 });
    }

    const totalMin = steps.reduce((sum: number, s: any) => sum + (typeof s.durationMinutes === 'number' ? s.durationMinutes : 0), 0);

    const created = await db.mission.create({
      data: {
        id: genId(),
        userId,
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        subject: typeof subject === 'string' ? subject.trim() : null,
        topic: typeof body.topic === 'string' ? body.topic.trim() : '',
        steps: JSON.stringify(steps),
        totalSteps: steps.length,
        completedSteps: 0,
        startMastery: 0,
        endMastery: 0,
        estimatedMinutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : (totalMin > 0 ? totalMin : null),
        xpReward: typeof xpReward === 'number' ? xpReward : 100,
        status: 'active',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    const result = {
      id: created.id,
      title: created.title,
      subject: created.subject || '',
      topic: created.topic || '',
      totalTimeMinutes: created.estimatedMinutes || 0,
      xpReward: created.xpReward || 0,
      completedSteps: 0,
      totalSteps: steps.length,
      steps: steps,
      status: 'active',
      currentMastery: 0,
      targetMastery: 0,
      createdAt: created.createdAt,
      completedAt: null,
      beforeMastery: 0,
    };

    return NextResponse.json({ mission: result }, { status: 201 });
  } catch (error) {
    console.error('[Missions POST] Route error:', error);
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
