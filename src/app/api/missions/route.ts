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

    const missions = db.mission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ missions });
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

    const { title, description, subject, steps, estimatedMinutes, xpReward, generateWithAI } = body;

    if (generateWithAI) {
      const subjectStr = typeof subject === 'string' ? subject : 'estudos gerais';
      const titleStr = typeof title === 'string' ? title : '';

      const aiResponse = await aiChat([
        {
          role: 'system',
          content: `Voce e um professor que cria missoes de estudo estruturadas. Crie uma missao de estudo${titleStr ? ` chamada "${titleStr}"` : ''} sobre "${subjectStr}". Responda APENAS com um JSON valido (sem markdown) com os campos: title (string, titulo da missao), description (string, descricao motivadora), subject (string), steps (array de strings com cada passo da missao, de 3 a 6 passos), estimatedMinutes (numero, tempo total estimado), xpReward (numero, entre 50 e 200). Tudo em portugues brasileiro.`,
        },
        {
          role: 'user',
          content: `Crie uma missao de estudo${titleStr ? `: ${titleStr}` : ''} sobre ${subjectStr}.`,
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
      const mission = db.mission.create({
        data: {
          id: genId(),
          userId,
          title: aiData.title || 'Missao gerada',
          description: aiData.description || null,
          subject: subjectStr,
          steps: JSON.stringify(stepsArr),
          totalSteps: stepsArr.length,
          estimatedMinutes: typeof aiData.estimatedMinutes === 'number' ? aiData.estimatedMinutes : null,
          xpReward: typeof aiData.xpReward === 'number' ? aiData.xpReward : 100,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
      });

      return NextResponse.json({ mission, aiGenerated: true }, { status: 201 });
    }

    // Manual creation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Etapas obrigatorias' }, { status: 400 });
    }

    const mission = db.mission.create({
      data: {
        id: genId(),
        userId,
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        subject: typeof subject === 'string' ? subject.trim() : null,
        steps: JSON.stringify(steps),
        totalSteps: steps.length,
        estimatedMinutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : null,
        xpReward: typeof xpReward === 'number' ? xpReward : 100,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ mission }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
