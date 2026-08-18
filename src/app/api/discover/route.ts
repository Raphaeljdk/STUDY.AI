import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db, genId, nowISO, sqlite } from '@/lib/db';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

const VALID_TYPES = ['mini_aula', 'dica', 'conceito', 'questao', 'resumo', 'curiosidade', 'tecnica', 'codigo', 'formula'];

export async function GET(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'discover');
    if (denied) return denied;
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where — filter out broken items with empty/default content
    const where: any = {
      isPublic: 1,
      AND: [
        { content: { not: '{}' } },
        { content: { not: '[]' } },
        { content: { not: '' } },
      ],
    };
    if (type && VALID_TYPES.includes(type)) {
      where.type = type;
    }

    const items = await db.discoverItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Math.min(limit, 50),
    });

    const total = await db.discoverItem.count({ where });

    if (items.length === 0) {
      return NextResponse.json({ items: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // Batch: get save counts for all items via single GROUP BY query
    const itemIds = items.map(i => i.id);
    const idList = itemIds.map((_, i) => `$${i + 1}`).join(', ');
    const saveCountResult = await sqlite.execute({ sql:
      `SELECT "discoverItemId", COUNT(*) as cnt FROM "DiscoverSave" WHERE "discoverItemId" IN (${idList}) GROUP BY "discoverItemId"`,
      args: itemIds
    });
    const saveCountMap = new Map<string, number>();
    for (const row of (saveCountResult.rows || [])) {
      saveCountMap.set(row.discoverItemId, Number(row.cnt) || 0);
    }

    // Batch: get all unique author IDs and fetch users
    const authorIds = [...new Set(items.map(i => i.userId).filter(Boolean))];
    let userMap = new Map<string, { id: string; name: string }>();
    if (authorIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: authorIds } },
        select: ['id', 'name'],
      });
      for (const u of users) userMap.set(u.id, { id: u.id, name: u.name });
    }

    // Batch: check which items current user saved
    let savedSet = new Set<string>();
    if (itemIds.length > 0) {
      const savedItems = await db.discoverSave.findMany({
        where: { userId, discoverItemId: { in: itemIds } },
        select: ['discoverItemId'],
      });
      savedSet = new Set(savedItems.map(s => s.discoverItemId));
    }

    // Assemble response
    const itemsWithMeta = items.map(item => ({
      ...item,
      saves: saveCountMap.get(item.id) || 0,
      isSaved: savedSet.has(item.id),
      user: item.userId ? (userMap.get(item.userId) || null) : null,
    }));

    return NextResponse.json({
      items: itemsWithMeta,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'discover');
    if (denied) return denied;
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { type, title, content, summary, subject, difficulty, duration, emoji, tags, generateWithAI } = body;

    if (generateWithAI) {
      const itemType = type && VALID_TYPES.includes(type) ? type : 'dica';
      const subjectStr = typeof subject === 'string' ? subject : 'estudos gerais';

      const aiResponse = await aiChatJSON([
        {
          role: 'system',
          content: `Voce e um educador brasileiro que cria conteudo educacional interessante. Gere um conteudo do tipo "${itemType}" sobre "${subjectStr}". Responda APENAS com um JSON valido (sem markdown) com os campos: title (string, titulo curto e chamativo), content (string, conteudo em markdown detalhado), summary (string, resumo em 1-2 frases), emoji (string, um emoji representativo), tags (string, tags separadas por virgula), difficulty (string: "facil", "medio" ou "dificil"), duration (numero, duracao estimada em segundos). Tudo em portugues brasileiro.`,
        },
        { role: 'user', content: `Crie um conteudo do tipo ${itemType} sobre ${subjectStr}.` },
      ], { maxTokens: 2000, temperature: 0.5 });

      const aiData = safeParseJSON(aiResponse);
      if (!aiData) {
        return NextResponse.json({ error: 'Erro ao gerar conteudo com IA' }, { status: 500 });
      }

      const item = await db.discoverItem.create({
        data: {
          id: genId(),
          type: itemType,
          title: aiData.title || 'Conteudo gerado',
          content: aiData.content || '',
          summary: aiData.summary || null,
          subject: subjectStr,
          difficulty: aiData.difficulty || 'medio',
          duration: typeof aiData.duration === 'number' ? aiData.duration : null,
          emoji: aiData.emoji || '💡',
          tags: aiData.tags || null,
          isPublic: 1,
          userId,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
      });

      return NextResponse.json({ item, aiGenerated: true }, { status: 201 });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Conteudo obrigatorio' }, { status: 400 });
    }

    const item = await db.discoverItem.create({
      data: {
        id: genId(),
        type: type && VALID_TYPES.includes(type) ? type : 'dica',
        title: title.trim(),
        content: content.trim(),
        summary: typeof summary === 'string' ? summary.trim() : null,
        subject: typeof subject === 'string' ? subject.trim() : null,
        difficulty: difficulty && ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio',
        duration: typeof duration === 'number' ? duration : null,
        emoji: typeof emoji === 'string' ? emoji : '💡',
        tags: typeof tags === 'string' ? tags : null,
        isPublic: 1,
        userId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ item }, { status: 201 });
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
