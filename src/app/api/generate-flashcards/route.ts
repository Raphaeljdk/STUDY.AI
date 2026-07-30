import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/zai';
import { canUse, incrementUsage } from '@/lib/usage';

const systemPrompt = `Voce e um gerador de flashcards educacionais. A partir do conteudo fornecido, gere flashcards de alta qualidade.

Regras:
- Responda APENAS com um JSON valido, sem nenhum texto adicional
- O JSON deve ser um array de objetos com "front" e "back"
- "front" deve ser uma pergunta clara e concisa
- "back" deve ser a resposta completa mas objetiva
- Gere entre 3 a 8 flashcards dependendo do conteudo
- Priorize os conceitos mais importantes
- Use linguagem clara e didatica
- Em portugues brasileiro`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true, plan: true, role: true } });
    if (!userExists) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });

    // Usage limit check
    const usageCheck = await canUse(userId, 'flashcards');
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: 'Limite diario atingido',
        code: 'USAGE_LIMIT',
        usage: { used: usageCheck.used, limit: usageCheck.limit, type: 'flashcards' },
      }, { status: 429 });
    }

    let body: any;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 }); }

    const { content, count: rawCount = 5 } = body;
    if (!content || typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'Conteudo e obrigatorio' }, { status: 400 });

    let count = 5;
    if (typeof rawCount === 'number' && Number.isFinite(rawCount)) count = Math.min(Math.max(Math.floor(rawCount), 1), 20);
    if (typeof rawCount === 'string' && rawCount.trim()) { const p = parseInt(rawCount, 10); if (Number.isFinite(p)) count = Math.min(Math.max(p, 1), 20); }

    const plainContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);

    const reply = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Gere ${count} flashcards a partir deste conteudo:\n\n${plainContent}` },
    ]);

    // Increment usage after successful generation
    incrementUsage(userId, 'flashcards').catch(() => {});

    let clean = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const flashcards = JSON.parse(clean);
      if (Array.isArray(flashcards)) {
        const valid = flashcards.filter((f: any) => f && typeof f.front === 'string' && typeof f.back === 'string').map((f: any) => ({ front: f.front.trim(), back: f.back.trim() }));
        return NextResponse.json({ flashcards: valid });
      }
    } catch {}
    return NextResponse.json({ flashcards: [] });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
