import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';
import { canUse, incrementUsage } from '@/lib/usage';

const systemPrompt = `Voce e um gerador de flashcards educacionais. A partir do conteudo fornecido, gere flashcards de alta qualidade.

Regras:
- Responda APENAS com um JSON valido, sem nenhum texto adicional
- O JSON deve ser um objeto com um campo "flashcards" contendo um array de objetos com "front" e "back"
- "front" deve ser uma pergunta clara e concisa
- "back" deve ser a resposta completa mas objetiva
- Gere entre 3 a 8 flashcards dependendo do conteudo
- Priorize os conceitos mais importantes
- Use linguagem clara e didatica
- Em portugues brasileiro`;

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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

    const reply = await aiChatJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Gere ${count} flashcards a partir deste conteudo:\n\n${plainContent}` },
    ], { maxTokens: 2000, temperature: 0.5 });

    // Increment usage after successful generation
    incrementUsage(userId, 'flashcards').catch(() => {});

    const parsed = safeParseJSON(reply);
    if (parsed && Array.isArray(parsed.flashcards)) {
      const valid = parsed.flashcards.filter((f: any) => f && typeof f.front === 'string' && typeof f.back === 'string').map((f: any) => ({ front: f.front.trim(), back: f.back.trim() }));
      return NextResponse.json({ flashcards: valid });
    }
    return NextResponse.json({ flashcards: [] });
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
