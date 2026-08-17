import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';
import { aiChat } from '@/lib/zai';

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

    // Detect AI generation: either explicit flag OR presence of subject+topic+timeAvailable (frontend format)
    const isAIGeneration = generateWithAI || (subject && topic && timeAvailable);

    if (isAIGeneration) {
      const subjectStr = typeof subject === 'string' ? subject : 'estudos gerais';
      const topicStr = typeof topic === 'string' ? topic : 'topico geral';
      const timeAvail = typeof timeAvailable === 'number' ? timeAvailable : (typeof estimatedMinutes === 'number' ? estimatedMinutes : 30);

      const aiResponse = await aiChat([
        {
          role: 'system',
          content: `Voce e um professor que cria missoes de estudo estruturadas em portugues brasileiro. Crie uma missao de estudo sobre "${subjectStr}" com foco no topico "${topicStr}". O tempo total disponivel e de ${timeAvail} minutos.

Responda APENAS com um JSON valido (sem markdown, sem code fences) com os campos:
- title (string): titulo criativo e motivador da missao
- description (string): descricao motivadora curta
- subject (string): a materia/disciplina
- steps (array de objetos): cada passo com os campos:
  - id (string): identificador unico como "step_1", "step_2", etc
  - title (string): titulo curto do passo
  - emoji (string): um emoji representativo do passo (ex: 📖, ✍️, 🧠, 💡, ⚡, 🎯)
  - durationMinutes (number): duracao estimada em minutos
  - completed (boolean): sempre false
  - description (string): descricao detalhada do que fazer neste passo

A soma de durationMinutes de todos os steps deve ser aproximadamente ${timeAvail} minutos. Crie de 3 a 6 passos. Tudo em portugues brasileiro.`,
        },
        {
          role: 'user',
          content: `Crie uma missao de estudo sobre ${subjectStr} - ${topicStr} com duracao total de ${timeAvail} minutos.`,
        },
      ]);

      let aiData: any;
      try {
        const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiData = JSON.parse(jsonStr);
      } catch {
        return NextResponse.json({ error: 'Erro ao gerar missao com IA' }, { status: 500 });
      }

      const stepsArr = Array.isArray(aiData.steps) ? aiData.steps : [];
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

      // Return in frontend-expected format
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

      return NextResponse.json(result, { status: 201 });
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
