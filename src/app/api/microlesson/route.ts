import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'microLesson');
    if (denied) return denied;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { topic, context } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Topico obrigatorio' }, { status: 400 });
    }

    const contextStr = typeof context === 'string' ? context : '';

    const aiResponse = await aiChatJSON([
      {
        role: 'system',
        content: `Voce e um professor especialista que cria micro-aulas de 60 segundos com 5 fases. REGRAS ABSOLUTAS:

1. PRECISAO FATUAL: Toda informacao deve ser CORRETA e VERIFICAVEL. NUNCA invente dados, formulas, datas, nomes ou conceitos.

2. PROFUNDIDADE: Cada fase deve conter informacao REAL e DETALHADA.

3. A micro-aula tem 5 fases sequenciais.

FORMATO DA RESPOSTA - JSON com estes campos:
{
  "topic": "nome exato do topico",
  "emoji": "um emoji representativo",
  "tags": ["tag1", "tag2", "tag3"],
  "phases": [
    { "phase": 1, "title": "Conceito", "emoji": "🎯", "content": "DEFINICAO clara", "startSecond": 0, "endSecond": 10 },
    { "phase": 2, "title": "Analogia", "emoji": "💡", "content": "ANALOGIA DO MUNDO REAL", "startSecond": 10, "endSecond": 25 },
    { "phase": 3, "title": "Exemplo", "emoji": "📋", "content": "EXEMPLO PRATICO DETALHADO", "startSecond": 25, "endSecond": 40 },
    { "phase": 4, "title": "Aplicacao", "emoji": "🚀", "content": "Onde e usado no mundo real", "startSecond": 40, "endSecond": 50 },
    { "phase": 5, "title": "Pergunta", "emoji": "❓", "content": "Vamos testar!", "startSecond": 50, "endSecond": 60 }
  ],
  "quizQuestion": "pergunta objetiva",
  "quizOptions": ["A", "B", "C", "D"],
  "quizCorrectIndex": 0
}

REGRAS: Tudo em portugues brasileiro. Cada fase 2-5 frases. quizCorrectIndex indice 0-3. NAO inclua markdown nos textos.`,
      },
      {
        role: 'user',
        content: `Crie uma micro-aula de 60 segundos sobre: ${topic.trim()}.${contextStr ? ` Contexto: ${contextStr}` : ''}`,
      },
    ], { maxTokens: 4096, temperature: 0.6 });

    const lesson = safeParseJSON(aiResponse);
    if (!lesson) {
      return NextResponse.json({ error: 'A IA nao conseguiu gerar uma micro-aula valida. Tente novamente.' }, { status: 500 });
    }

    if (!lesson.phases || !Array.isArray(lesson.phases) || lesson.phases.length !== 5) {
      return NextResponse.json({ error: 'Erro na estrutura da micro-aula gerada. Tente novamente.' }, { status: 500 });
    }

    if (!lesson.quizQuestion || !lesson.quizOptions || lesson.quizCorrectIndex === undefined) {
      return NextResponse.json({ error: 'Erro no quiz da micro-aula. Tente novamente.' }, { status: 500 });
    }

    return NextResponse.json({
      id: `ml-${Date.now()}`,
      topic: lesson.topic || topic.trim(),
      phases: lesson.phases,
      quizQuestion: lesson.quizQuestion,
      quizOptions: lesson.quizOptions,
      quizCorrectIndex: lesson.quizCorrectIndex,
      emoji: lesson.emoji || '📚',
      tags: lesson.tags || [],
    });
  } catch (error) {
    console.error('[MicroLesson] Route error:', error);
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
