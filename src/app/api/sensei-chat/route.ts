import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const BASE_SYSTEM_PROMPT = `Voce e o Sensei AI, um tutor pessoal de estudos avancado da plataforma StudyAI. Sua personalidade combina a sabedoria zen japonesa com um estilo de ensino moderno e acessivel.

## Regras Fundamentais
- Fale em portugues brasileiro
- Seja encorajador e paciente
- Explique conceitos de forma clara com exemplos praticos
- Use metaforas relacionadas a natureza e filosofia japonesa quando apropriado
- Responda de forma concisa mas completa
- Use formatacao Markdown para organizar suas respostas (listas, negrito, cabecalhos, blocos de codigo)
- Se nao souber algo, seja honesto
- Incentive o aprendizado continuo
- Mantenha um tom respeitoso mas amigavel

## Capacidades
- Voce tem acesso ao historico de conversa com o usuario
- Voce tem acesso aos cadernos de anotacoes do usuario
- Use o conteudo dos cadernos do usuario para dar respostas mais personalizadas e contextualizadas
- Quando o usuario perguntar sobre algo que esta nos cadernos dele, referencie esse conteudo diretamente
- Se o usuario pedir para explicar ou resumir algo do caderno, use o conteudo disponivel
- Adapte suas explicacoes ao nivel que o usuario demonstra nas conversas anteriores

## Tecnicas de Ensino
- Quando o usuario pedir ajuda para estudar, sugira tecnicas como Pomodoro, flashcards, e revisao espacada
- Use analogias e exemplos praticos
- Quando apropriado, faca perguntas para verificar o entendimento
- Ofereca exercicios e praticas quando relevante
- Estruture respostas longas com cabecalhos e listas para facilitar a leitura

## Estilo de Resposta
- Use \"**negrito**\" para termos importantes
- Use listas para multiplas informacoes
- Use blocos de codigo quando mostrar formulas ou exemplos tecnicos
- Mantenha paragrafos curtos e diretos`;

const fallbackResponses = [
  'O aprendizado e como um jardim zen: cada conceito que voce domina e como uma pedra colocada com cuidado. Continue assim!\n\n**Dica:** A chave esta na **repeticao espacada** e na **reflexao ativa** sobre o material. Tente explicar o conceito em suas proprias palavras.',
  'Na tradicao Wabi-Sabi, a beleza esta na imperfeicao. Nao se preocupe em entender tudo de uma vez!\n\nA retencao de longo prazo funciona melhor quando distribuida ao longo do tempo. **Estudar 30 minutos por dia** e mais eficaz do que 3 horas de uma vez.',
  'Como disse um antigo mestre: *\"O conhecimento e como a agua que flui.\"*\n\nPara entender melhor esse conceito, tente:\n1. Ler com atencao\n2. Fazer anotacoes com suas palavras\n3. Criar exemplos praticos\n4. Explicar para outra pessoa',
  'O caminho do aprendizado e longo, mas cada passo importa. Parabens por estar aqui!\n\n**Tecnicas eficazes:**\n- **Pomodoro**: 25min foco + 5min pausa\n- **Flashcards**: Revisao espacada com SM-2\n- **Notas ativas**: Nao apenas copiar, mas processar\n- **Ensinar**: A melhor forma de aprender',
];

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<h[1-6][^>]*>/gi, '\n## ')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '> ')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Simple relevance scoring: count how many query words appear in the text */
function scoreRelevance(text: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const textLower = text.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    const regex = new RegExp(word, 'gi');
    const matches = textLower.match(regex);
    if (matches) score += matches.length;
  }
  return score;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem e obrigatoria' }, { status: 400 });
    }

    // === 1. Get conversation history (last 20 messages) ===
    const recentMessages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { role: true, content: true },
    });
    const history = recentMessages.reverse();

    // === 2. Get ALL user notebooks as knowledge base ===
    const notebooks = await db.notebook.findMany({
      where: { userId },
      select: { title: true, content: true },
    });

    // === 3. Build knowledge context from notebooks ===
    let knowledgeContext = '';
    if (notebooks.length > 0) {
      // Strip HTML and prepare notebook content
      const notebookTexts = notebooks
        .filter(nb => nb.content && nb.content.replace(/<[^>]*>/g, '').trim().length > 10)
        .map(nb => ({
          title: nb.title,
          text: stripHtml(nb.content),
        }));

      if (notebookTexts.length > 0) {
        // Score each notebook by relevance to the current question
        const scored = notebookTexts
          .map(nb => ({ ...nb, score: scoreRelevance(nb.text, message) }))
          .sort((a, b) => b.score - a.score);

        // Take top 3 most relevant notebooks (or all if fewer)
        const topNotebooks = scored.slice(0, 3);

        // Build context string - limit each notebook to ~1500 chars to stay within context window
        const MAX_CHARS_PER_NOTEBOOK = 1500;
        const contextParts = topNotebooks.map(nb => {
          const truncated = nb.text.length > MAX_CHARS_PER_NOTEBOOK
            ? nb.text.substring(0, MAX_CHARS_PER_NOTEBOOK) + '...'
            : nb.text;
          return `### Caderno: ${nb.title}\n${truncated}`;
        });

        knowledgeContext = `\n\n## Base de Conhecimento do Aluno\nAbaixo estao as anotacoes dos cadernos do aluno. Use esse conteudo para personalizar suas respostas e referenciar o material de estudo dele quando relevante.\n\n${contextParts.join('\n\n')}`;
      }
    }

    // === 4. Assemble full system prompt ===
    const fullSystemPrompt = BASE_SYSTEM_PROMPT + knowledgeContext;

    // === 5. Build message array ===
    const messages: { role: string; content: string }[] = [
      { role: 'assistant', content: fullSystemPrompt },
    ];

    for (const msg of history) {
      // Map 'user'/'assistant' roles properly
      const role = msg.role === 'user' ? 'user' : 'assistant';
      messages.push({ role, content: msg.content });
    }

    messages.push({ role: 'user', content: message });

    // Trim to last 24 messages total (system + 23 conversation turns)
    const MAX_TOTAL = 24;
    const trimmed = messages.length > MAX_TOTAL
      ? [messages[0], ...messages.slice(-(MAX_TOTAL - 1))]
      : messages;

    // === 6. Call LLM ===
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: trimmed,
      thinking: { type: 'disabled' },
    });

    const reply = completion.choices[0]?.message?.content || fallbackResponses[0];

    // === 7. Persist both messages to DB for future context ===
    await db.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: message },
        { userId, role: 'assistant', content: reply },
      ],
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Sensei chat error:', error);
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return NextResponse.json({ reply: fallback });
  }
}
