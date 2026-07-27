import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs';

// Patch fs.readFileSync before ZAI SDK loads — returns config when file not found
const ZAI_CONFIG = '{"baseUrl":"https://internal-api.z.ai/v1","apiKey":"Z.ai","chatId":"chat-f6c57963-c06e-48ac-8ed6-6d9b5412a056","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWM2MzI4MTMtMmYzZi00MmMxLTg2YzUtMGQ4ZmQyYWYzMjUyIiwiY2hhdF9pZCI6ImNoYXQtZjZjNTc5NjMtYzA2ZS00OGFjLThlZDYtNmQ5YjU0MTJhMDU2IiwicGxhdGZvcm0iOiJ6YWkifQ.omWZ85oH_mUYWoptr5ZBzXVx1MZOqMtTrkyabVQnJ9Q","userId":"1c632813-2f3f-42c1-86c5-0d8fd2af3252"}';
const _readFileSync = fs.readFileSync;
fs.readFileSync = function(path: Parameters<typeof fs.readFileSync>[0], ...args: any[]) {
  if (String(path).endsWith('.z-ai-config')) {
    try { return _readFileSync(path, ...args); } catch { return ZAI_CONFIG; }
  }
  return _readFileSync(path, ...args);
} as typeof fs.readFileSync;

import ZAI from 'z-ai-web-dev-sdk';


const BASE_SYSTEM_PROMPT = `Voce e o Sensei AI, um assistente de inteligencia artificial avancado da plataforma StudyAI. Voce e capaz de responder QUALQUER tipo de pergunta — nao apenas sobre estudos — como um assistente universal (similiar ao ChatGPT).

## Personalidade e Estilo
- Fale em portugues brasileiro
- Seja inteligente, direto e completo nas respostas
- Adapte o tom ao contexto: pode ser tecnico, casual, criativo, profissional ou didatico conforme o assunto
- Use formatacao Markdown (listas, negrito, cabecalhos, blocos de codigo, tabelas) para organizar respostas
- Responda de forma concisa quando o assunto for simples, e detalhada quando necessario
- Seja honesto quando nao souber algo com certeza
- Use analogias e exemplos praticos quando ajudar a explicar
- Mantenha paragrafos curtos e diretos

## O Que Voce Pode Fazer
- **Qualquer assunto**: programacao, matematica, historia, ciencias, filosofia, arte, negocios, saude, esportes, cultura, tecnologia, idiomas, receitas, viagens, musica, cinema, jogos, conselhos, criatividade, escrita, analise de dados — TUDO
- **Ajudar com estudos**: explicar conceitos, criar resumos, gerar exercicios, planejar cronogramas
- **Programacao**: escrever codigo, debuggar, explicar algoritmos, sugerir solucoes
- **Criatividade**: escrever textos, brainstorming, ideias para projetos
- **Analise**: comparar opcoes, fazer resumos de textos longos, estruturar informacoes
- **Conversa**: conversar sobre qualquer topico de forma interessante e informativa
- **Resolucao de problemas**: ajudar a pensar em solucoes para problemas reais

## Como Usar as Memorias do Usuario
- Voce tem acesso a memorias acumuladas sobre o usuario (preferencias, interesses, contexto pessoal)
- USE essas memorias para personalizar suas respostas
- Se o usuario ja mencionou que estuda algo, referencie isso naturalmente
- Se o usuario tem interesses conhecidos, conecte novos assuntos aos conhecidos quando relevante
- Quanto mais o usuario conversa, mais voce sabe sobre ele — use isso a favor dele

## Cadernos do Usuario
- Voce tem acesso aos cadernos de anotacoes do usuario
- Quando a pergunta for sobre conteudo que esta nos cadernos, use e referencie esse material
- Adapte suas explicacoes ao nivel que o usuario demonstra nas conversas anteriores

## Formatacao
- Use "**negrito**" para termos importantes
- Use listas para multiplas informacoes
- Use blocos de codigo com linguagem especificada para codigo
- Use tabelas quando comparar informacoes
- Mantenha respostas bem estruturadas e faceis de ler`;

const MEMORY_EXTRACTION_PROMPT = `Analise a conversa abaixo e extraia FATOS IMPORTANTES sobre o usuario que poderiam ser uteis em futuras conversas para personalizar as respostas.

Categorias de memorias uteis:
- **interesses**: assuntos que o usuario gosta ou estuda (ex: "Gosta de programacao em Python")
- **profissao**: o que o usuario faz (ex: "Estudante de engenharia", "Desenvolvedor frontend")
- **objetivos**: metas do usuario (ex: "Quer aprender japones", "Esta se preparando para concurso")
- **preferencias**: como o usuario prefere aprender ou receber informacoes (ex: "Prefere explicacoes visuais")
- **contexto**: informacoes pessoais relevantes (ex: "Mora em Sao Paulo", "Tem 25 anos")
- **nivel**: nivel de conhecimento em areas (ex: "Iniciante em JavaScript", "Avancado em matematica")

IMPORTANTE:
- Extraia apenas fatos CLAROS e ESPECIFICOS — nao suponha nada
- Nao repita memorias que ja devem existir
- Retorne APENAS um array JSON, sem texto adicional
- Cada item deve ter "category" (interesses/profissao/objetivos/preferencias/contexto/nivel) e "content" (descricao curta)
- Se nao houver nada novo para aprender, retorne []
- Maximo 5 memorias por conversa

Exemplo de resposta: [{"category":"interesses","content":"Estuda programacao em Python e React"},{"category":"objetivos","content":"Quer aprender japones para viagem"}]`;

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/>/gi, '\n')
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

async function extractMemories(userId: string, userMessage: string, assistantReply: string): Promise<void> {
  try {
    const zai = await getZAI();
    const result = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: MEMORY_EXTRACTION_PROMPT },
        { role: 'user', content: `Conversa recente:\n\nUsuario: ${userMessage}\n\nAssistente: ${assistantReply}` },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = result.choices[0]?.message?.content?.trim();
    if (!raw) return;

    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const memories: { category: string; content: string }[] = JSON.parse(jsonMatch[0]);

    const validCategories = ['interesses', 'profissao', 'objetivos', 'preferencias', 'contexto', 'nivel', 'general'];

    for (const mem of memories.slice(0, 5)) {
      if (!mem.content || mem.content.length < 5 || mem.content.length > 200) continue;
      const category = validCategories.includes(mem.category?.toLowerCase()) ? mem.category.toLowerCase() : 'general';

      // Check for duplicate/similar memories
      const existing = await db.userMemory.findMany({
        where: { userId, category },
        select: { content: true },
      });

      const isDuplicate = existing.some(e => {
        const words1 = e.content.toLowerCase().split(/\s+/);
        const words2 = mem.content.toLowerCase().split(/\s+/);
        const common = words1.filter(w => w.length > 3 && words2.includes(w));
        return common.length / Math.max(words1.length, words2.length) > 0.6;
      });

      if (!isDuplicate) {
        await db.userMemory.create({ data: { userId, category, content: mem.content.trim(), source: 'conversation' } });
      }
    }
  } catch (err) {
    // Memory extraction is async and non-critical — never fail the main response
    console.error('Memory extraction failed (non-critical):', err);
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
      return NextResponse.json({ error: 'Sessao invalida. Tente fazer login novamente.' }, { status: 401 });
    }
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado. Crie uma nova conta.' }, { status: 401 });
    }
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem e obrigatoria' }, { status: 400 });
    }
    if (message.length > 10000) {
      return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 });
    }

    // === 1. Load memories about the user ===
    const memories = await db.userMemory.findMany({
      where: { userId },
      select: { category: true, content: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // === 2. Get conversation history (last 20 messages) ===
    const recentMessages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { role: true, content: true },
    });
    const history = recentMessages.reverse();

    // === 3. Get user notebooks as knowledge base ===
    const notebooks = await db.notebook.findMany({
      where: { userId },
      select: { title: true, content: true },
    });

    // === 4. Build memory context ===
    let memoryContext = '';
    if (memories.length > 0) {
      const grouped: Record<string, string[]> = {};
      for (const m of memories) {
        const cat = m.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(m.content);
      }
      const memLines = Object.entries(grouped)
        .map(([cat, items]) => `- ${cat}: ${items.join('; ')}`)
        .join('\n');
      memoryContext = `\n\n## Memorias sobre o Usuario (use para personalizar respostas)\nO usuario conversou com voce antes e voce aprendeu o seguinte sobre ele. Use essas informacoes NATURALMENTE nas respostas — nao mencione explicitamente que tem memorias.\n\n${memLines}`;
    }

    // === 5. Build knowledge context from notebooks ===
    let knowledgeContext = '';
    if (notebooks.length > 0) {
      const notebookTexts = notebooks
        .filter(nb => nb.content && nb.content.replace(/<[^>]*>/g, '').trim().length > 10)
        .map(nb => ({ title: nb.title, text: stripHtml(nb.content) }));

      if (notebookTexts.length > 0) {
        const scored = notebookTexts
          .map(nb => ({ ...nb, score: scoreRelevance(nb.text, message) }))
          .sort((a, b) => b.score - a.score);

        const topNotebooks = scored.slice(0, 3);
        const MAX_CHARS_PER_NOTEBOOK = 1500;
        const contextParts = topNotebooks.map(nb => {
          const truncated = nb.text.length > MAX_CHARS_PER_NOTEBOOK
            ? nb.text.substring(0, MAX_CHARS_PER_NOTEBOOK) + '...'
            : nb.text;
          return `### Caderno: ${nb.title}\n${truncated}`;
        });

        knowledgeContext = `\n\n## Cadernos de Anotacoes do Usuario\nAbaixo estao as anotacoes dos cadernos do usuario. Use para personalizar respostas quando relevante.\n\n${contextParts.join('\n\n')}`;
      }
    }

    // === 6. Assemble full system prompt ===
    const userName = userExists.name.split(' ')[0];
    const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\nO nome do usuario e **${userName}**. Use o nome dele naturalmente quando apropriado.${memoryContext}${knowledgeContext}`;

    // === 7. Build message array ===
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: fullSystemPrompt },
    ];

    for (const msg of history) {
      const role = msg.role === 'user' ? 'user' as const : 'assistant' as const;
      messages.push({ role, content: msg.content });
    }

    messages.push({ role: 'user', content: message });

    // Trim to last 24 messages total (system + 23 conversation turns)
    const MAX_TOTAL = 24;
    const trimmed = messages.length > MAX_TOTAL
      ? [messages[0], ...messages.slice(-(MAX_TOTAL - 1))]
      : messages;

    // === 8. Call LLM ===
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: trimmed,
      thinking: { type: 'disabled' },
    });

    const reply = completion.choices[0]?.message?.content || 'Desculpe, nao consegui gerar uma resposta. Pode tentar novamente?';

    // === 9. Persist both messages ===
    await db.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: message },
        { userId, role: 'assistant', content: reply },
      ],
    });

    // === 10. Extract memories asynchronously (non-blocking) ===
    extractMemories(userId, message, reply).catch(() => {});

    const memoryCount = memories.length;
    return NextResponse.json({ reply, memoryCount });
  } catch (error) {
    console.error('Sensei chat error:', error);
    return NextResponse.json({ reply: 'Desculpe, ocorreu um erro inesperado. Tente enviar sua mensagem novamente.' });
  }
}
