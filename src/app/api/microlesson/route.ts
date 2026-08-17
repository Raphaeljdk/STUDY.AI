import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { canAccess, FEATURE_MIN_PLAN } from '@/lib/plan-gating';
import { aiChat } from '@/lib/zai';

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'microLesson')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['microLesson'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }

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

    const aiResponse = await aiChat([
      {
        role: 'system',
        content: `Voce e um professor especialista que cria micro-aulas de 60 segundos com 5 fases. REGRAS ABSOLUTAS:

1. PRECISAO FATUAL: Toda informacao deve ser CORRETA e VERIFICAVEL. NUNCA invente dados, formulas, datas, nomes ou conceitos. Se nao tiver certeza absoluta sobre um fato, declare explicitamente. Conteudo equivocado e inaceitavel.

2. PROFUNDIDADE: Cada fase deve conter informacao REAL e DETALHADA. Nao use vaguedades como "e algo importante" ou "tem diversas aplicacoes". Seja especifico com nomes, numeros, mecanismos, formulas ou exemplos concretos.

3. A micro-aula tem 5 fases sequenciais. Para cada fase, voce deve produzir conteudo rico e informativo.

FORMATO DA RESPOSTA - Responda APENAS com um JSON valido (sem markdown, sem backticks):

{
  "topic": "nome exato do topico abordado",
  "emoji": "um emoji que representa o topico",
  "tags": ["tag1", "tag2", "tag3"],
  "phases": [
    {
      "phase": 1,
      "title": "Conceito",
      "emoji": "🎯",
      "content": "DEFINICAO clara e precisa do conceito. O que exatamente e? Qual a definicao formal? Inclua detalhes especificos: formulas, mecanismos, nomes tecnicos, datas relevantes. Seja didatico mas rigoroso. NAO use definicoes vagas.",
      "startSecond": 0,
      "endSecond": 10
    },
    {
      "phase": 2,
      "title": "Analogia",
      "emoji": "💡",
      "content": "Uma ANALOGIA DO MUNDO REAL que torne o conceito intuitivo e memoravel. A analogia deve ser PRECISA - nao distorcer o conceito. Conecte elementos da analogia aos elementos reais do conceito. Ex: se o topico for fotossintese, compare a um processo industrial com etapas claras.",
      "startSecond": 10,
      "endSecond": 25
    },
    {
      "phase": 3,
      "title": "Exemplo",
      "emoji": "📋",
      "content": "Um EXEMPLO PRATICO e DETALHADO. Para topicos de programacao, mostre CODIGO REAL com sintaxe correta. Para ciencias, mostre um caso concreto com valores. Para historia, cite eventos especificos com datas e nomes. Para matematica, mostre o calculo passo a passo. O exemplo deve ser aplicavel e correto.",
      "startSecond": 25,
      "endSecond": 40
    },
    {
      "phase": 4,
      "title": "Aplicacao",
      "emoji": "🚀",
      "content": "Onde isso e USADO NO MUNDO REAL? Cite aplicacoes praticas e especificas: empresas, tecnologias, fenomenos naturais, processos industriais, ferramentas de software. Seja concreto - diga ONDE e COMO e usado, nao apenas que "e muito usado".",
      "startSecond": 40,
      "endSecond": 50
    },
    {
      "phase": 5,
      "title": "Pergunta",
      "emoji": "❓",
      "content": "Agora vamos testar o que voce aprendeu!",
      "startSecond": 50,
      "endSecond": 60
    }
  ],
  "quizQuestion": "Uma pergunta objetiva sobre o conteudo ensinado que exija raciocinio (nao apenas memorizacao superficial)",
  "quizOptions": ["Opcao A", "Opcao B", "Opcao C", "Opcao D"],
  "quizCorrectIndex": 0
}

REGRAS ESPECIFICAS:
- Tudo em portugues brasileiro
- Cada fase content deve ter entre 2 a 5 frases completas e informativas
- O quizQuestion deve testar COMPREENSAO, nao apenas memorizacao literal
- As 4 quizOptions devem ser plausiveis (distratores realistas)
- quizCorrectIndex e o indice (0-3) da resposta correta em quizOptions
- Para topicos de programacao: Fase 3 DEVE ter codigo real com sintaxe correta
- Para topicos de ciencia: inclua dados numericos reais quando aplicavel
- Para topicos de historia: inclua datas e nomes historicos corretos
- NUNCA fabrique informacao. Se nao souber algo com certeza, diga que nao tem certeza
- NAO inclua markdown nos campos de texto
- O campo "content" de cada fase deve ser texto puro, sem formatacao markdown`,
      },
      {
        role: 'user',
        content: `Crie uma micro-aula de 60 segundos sobre: ${topic.trim()}.${contextStr ? ` Contexto adicional do estudante: ${contextStr}` : ''}`,
      },
    ]);

    let lesson: any;
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      lesson = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: 'Erro ao gerar micro-aula com IA' }, { status: 500 });
    }

    // Validate that the response has the expected structure
    if (!lesson.phases || !Array.isArray(lesson.phases) || lesson.phases.length !== 5) {
      return NextResponse.json({ error: 'Erro na estrutura da micro-aula gerada' }, { status: 500 });
    }

    if (!lesson.quizQuestion || !lesson.quizOptions || lesson.quizCorrectIndex === undefined) {
      return NextResponse.json({ error: 'Erro no quiz da micro-aula gerada' }, { status: 500 });
    }

    // Return the lesson data directly (not wrapped) so the frontend can use it as MicroLessonData
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
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
