import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/zai';

const VALID_TYPES = ['mini_aula', 'dica', 'conceito', 'questao', 'resumo', 'curiosidade', 'tecnica', 'codigo', 'formula'];

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { isPublic: true };
    if (type && VALID_TYPES.includes(type)) {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      db.discoverItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(limit, 50),
        include: {
          _count: { select: { discoverSaves: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      db.discoverItem.count({ where }),
    ]);

    // Check which items the current user saved
    const savedItems = await db.discoverSave.findMany({
      where: { userId, discoverItemId: { in: items.map(i => i.id) } },
      select: { discoverItemId: true },
    });
    const savedSet = new Set(savedItems.map(s => s.discoverItemId));

    const itemsWithSaved = items.map(item => ({
      ...item,
      isSaved: savedSet.has(item.id),
    }));

    return NextResponse.json({
      items: itemsWithSaved,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    const { type, title, content, summary, subject, difficulty, duration, emoji, tags, generateWithAI } = body;

    if (generateWithAI) {
      // AI-generated discover item
      const itemType = type && VALID_TYPES.includes(type) ? type : 'dica';
      const subjectStr = typeof subject === 'string' ? subject : 'estudos gerais';

      const aiResponse = await aiChat([
        {
          role: 'system',
          content: `Voce e um educador brasileiro que cria conteudo educacional interessante. Gere um conteudo do tipo "${itemType}" sobre "${subjectStr}". Responda APENAS com um JSON valido (sem markdown) com os campos: title (string, titulo curto e chamativo), content (string, conteudo em markdown detalhado), summary (string, resumo em 1-2 frases), emoji (string, um emoji representativo), tags (string, tags separadas por virgula), difficulty (string: "facil", "medio" ou "dificil"), duration (numero, duracao estimada em segundos). Tudo em portugues brasileiro.`,
        },
        {
          role: 'user',
          content: `Crie um conteudo do tipo ${itemType} sobre ${subjectStr}.`,
        },
      ]);

      let aiData: any;
      try {
        const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiData = JSON.parse(jsonStr);
      } catch {
        return NextResponse.json({ error: 'Erro ao gerar conteudo com IA' }, { status: 500 });
      }

      const item = await db.discoverItem.create({
        data: {
          type: itemType,
          title: aiData.title || 'Conteudo gerado',
          content: aiData.content || '',
          summary: aiData.summary || null,
          subject: subjectStr,
          difficulty: aiData.difficulty || 'medio',
          duration: typeof aiData.duration === 'number' ? aiData.duration : null,
          emoji: aiData.emoji || '💡',
          tags: aiData.tags || null,
          isPublic: true,
          userId,
        },
      });

      return NextResponse.json({ item, aiGenerated: true }, { status: 201 });
    }

    // Manual creation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Conteudo obrigatorio' }, { status: 400 });
    }

    const item = await db.discoverItem.create({
      data: {
        type: type && VALID_TYPES.includes(type) ? type : 'dica',
        title: title.trim(),
        content: content.trim(),
        summary: typeof summary === 'string' ? summary.trim() : null,
        subject: typeof subject === 'string' ? subject.trim() : null,
        difficulty: difficulty && ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio',
        duration: typeof duration === 'number' ? duration : null,
        emoji: typeof emoji === 'string' ? emoji : '💡',
        tags: typeof tags === 'string' ? tags : null,
        isPublic: true,
        userId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
