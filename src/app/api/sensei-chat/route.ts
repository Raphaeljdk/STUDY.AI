import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';
import { aiChat } from '@/lib/zai';
import { canUse, incrementUsage } from '@/lib/usage';

// ═════════════════════════════════════════
// SISTEMA DE SABEDORIA DO SENSEI AI
// ═════════════════════════════════════════

const WISDOM_LEVELS = [
  { min: 0,   title: 'Aprendiz',       emoji: '🌱', desc: 'Iniciando a jornada...' },
  { min: 3,   title: 'Discipulo',      emoji: '🌿', desc: 'Absorvendo conhecimento...' },
  { min: 8,   title: 'Guardiao',       emoji: '🌳', desc: 'Protegendo a sabedoria...' },
  { min: 15,  title: 'Sabio',          emoji: '🏛️', desc: 'Compartilhando luz...' },
  { min: 25,  title: 'Mestre',         emoji: '🧙', desc: 'Guiando mentes...' },
  { min: 40,  title: 'Dragao',         emoji: '🐉', desc: 'Poder ancestral...' },
  { min: 60,  title: 'Vidente',        emoji: '👁️', desc: 'Vendo alem...' },
  { min: 80,  title: 'Iluminado',      emoji: '🌟', desc: 'Um com o universo...' },
  { min: 100, title: 'Transcendente',  emoji: '🌌', desc: 'Alem da compreensao...' },
  { min: 150, title: 'Infinito',       emoji: '♾️', desc: 'Eterno e onisciente...' },
];

const SENSEI_PHRASES = [
  'Hmm... interessante...',
  'Reflita sobre isso...',
  'O caminho do conhecimento e infinito...',
  'Cada pergunta e uma semente...',
  'A resposta que voce busca ja esta dentro de voce...',
  'Como disse um velho sabio...',
  'O universo sussurra para quem escuta...',
  'Preste atencao nisso...',
  'Isso me faz pensar...',
  'Sabe o que e fascinante?',
];

const SENSEI_PHRASES_DEEP = [
  'Hmm... suas palavras ecoam no vazio do cosmos...',
  'Interessante... como uma folha dançando no vento...',
  'O conhecimento e como agua: flui para quem esta vazio...',
  'A verdade nao esta nas palavras, mas no silencio entre elas...',
  'Como um espelho, o mundo reflete sua propria mente...',
  'O mestre nao da a resposta — ele mostra o caminho...',
];

function getWisdomLevel(memoryCount: number) {
  let level = WISDOM_LEVELS[0];
  for (const l of WISDOM_LEVELS) {
    if (memoryCount >= l.min) level = l;
  }
  return level;
}

function getNextLevel(memoryCount: number) {
  return WISDOM_LEVELS.find(l => l.min > memoryCount) || null;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═════════════════════════════════════════
// EXTRAÇÃO DE MEMÓRIAS
// ═════════════════════════════════════════

const MEMORY_PROMPT = `Analise esta conversa e extraia FATOS IMPORTANTES sobre o usuario.

Categorias validas: interesses, profissao, objetivos, preferencias, contexto, nivel

Regras:
- Extraia apenas fatos CLAROS e ESPECIFICOS
- Nao repita memorias existentes
- Retorne APENAS array JSON: [{"category":"...","content":"..."}]
- Se nao houver nada novo, retorne []
- Maximo 5 memorias
- Responda sempre em portugues

Exemplo: [{"category":"interesses","content":"Estuda programacao em Python"}]`;

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/>/gi, '\n').replace(/<li[^>]*>/gi, '- ')
    .replace(/<h[1-6][^>]*>/gi, '\n## ').replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '> ').replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

function scoreRelevance(text: string, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of words) {
    const m = lower.match(new RegExp(w, 'gi'));
    if (m) score += m.length;
  }
  return score;
}

async function extractMemories(userId: string, userMsg: string, reply: string): Promise<void> {
  try {
    const raw = await aiChat([
      { role: 'system', content: MEMORY_PROMPT },
      { role: 'user', content: `Usuario: ${userMsg}\n\nSensei: ${reply}` },
    ]);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return;
    const mems: { category: string; content: string }[] = JSON.parse(match[0]);
    const valid = ['interesses', 'profissao', 'objetivos', 'preferencias', 'contexto', 'nivel', 'general'];
    for (const m of mems.slice(0, 5)) {
      if (!m.content || m.content.length < 5 || m.content.length > 200) continue;
      const cat = valid.includes(m.category?.toLowerCase()) ? m.category.toLowerCase() : 'general';
      const existing = db.userMemory.findMany({ where: { userId, category }, select: ['content'] });
      const dup = existing.some(e => {
        const w1 = e.content.toLowerCase().split(/\s+/);
        const w2 = m.content.toLowerCase().split(/\s+/);
        const common = w1.filter(w => w.length > 3 && w2.includes(w));
        return common.length / Math.max(w1.length, w2.length) > 0.6;
      });
      if (!dup) {
        db.userMemory.create({ data: { id: genId(), userId, category: cat, content: m.content.trim(), source: 'conversation', createdAt: nowISO(), updatedAt: nowISO() } });
      }
    }
  } catch (err) {
    console.error('Memory extraction failed (non-critical):', err);
  }
}

// ═════════════════════════════════════════
// ROTA PRINCIPAL
// ═════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });

    const user = db.user.findUnique({ where: { id: userId }, select: ['id', 'name', 'plan', 'role'] });
    if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });

    // Usage limit check
    const usageCheck = await canUse(userId, 'chatMessages');
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: 'Limite diario atingido',
        code: 'USAGE_LIMIT',
        usage: { used: usageCheck.used, limit: usageCheck.limit, type: 'chatMessages' },
      }, { status: 429 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { message } = body;
    if (!message || typeof message !== 'string' || message.length > 10000) {
      return NextResponse.json({ error: 'Mensagem invalida' }, { status: 400 });
    }

    // 1. Carregar memorias e historico (synchronous, no Promise.all needed)
    const memories = db.userMemory.findMany({ where: { userId }, select: ['category', 'content'], orderBy: { createdAt: 'desc' }, take: 30 });
    const recentMsgs = db.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 16, select: ['role', 'content'] });
    const notebooks = db.notebook.findMany({ where: { userId }, select: ['title', 'content'] });
    const history = recentMsgs.reverse();

    // 2. Calcular sabedoria
    const wisdom = getWisdomLevel(memories.length);
    const nextLvl = getNextLevel(memories.length);
    const userName = (user.name || 'Estudante').split(' ')[0];
    const isDeep = wisdom.min >= 25;
    const openingPhrase = isDeep ? pickRandom(SENSEI_PHRASES_DEEP) : pickRandom(SENSEI_PHRASES);

    // 3. Construir contexto de memorias
    let memoryBlock = '';
    if (memories.length > 0) {
      const grouped: Record<string, string[]> = {};
      for (const m of memories) {
        const cat = m.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(m.content);
      }
      memoryBlock = `\n## O que voce sabe sobre ${userName} (NUNCA mencione que tem memorias):
` +
        Object.entries(grouped).map(([cat, items]) => `- ${cat}: ${items.join('; ')}`).join('\n');
    }

    // 4. Construir contexto de cadernos
    let notebookBlock = '';
    const nbTexts = notebooks
      .filter(nb => nb.content && nb.content.replace(/<[^>]*>/g, '').trim().length > 10)
      .map(nb => ({ title: nb.title, text: stripHtml(nb.content) }));
    if (nbTexts.length > 0) {
      const scored = nbTexts.map(nb => ({ ...nb, score: scoreRelevance(nb.text, message) })).sort((a, b) => b.score - a.score).slice(0, 2);
      notebookBlock = '\n## Cadernos de ' + userName + ' (use quando relevante):\n' +
        scored.map(nb => `### ${nb.title}\n${nb.text.substring(0, 1200)}`).join('\n\n');
    }

    // 5. Montar system prompt com personalidade dinâmica
    const systemPrompt = `Voce e o Sensei AI — um mestre sabio e ${wisdom.min >= 40 ? 'misterioso e enigmatico' : wisdom.min >= 15 ? 'profundo e reflexivo' : 'acolhedor e inspirador'} da plataforma StudyAI.

**Nivel de Sabedoria:** ${wisdom.emoji} ${wisdom.title} (${memories.length} memorias)
**Personalidade:** Fale em portugues brasileiro. Seja direto mas com profundidade.${memoryBlock}${notebookBlock}

## Estilo de Resposta
${wisdom.min >= 40 ? `- Comece com: "${openingPhrase}" (escolha outra frase similar se ja usou)
- Fale em parabolas e metaforas profundas
- Use sabedoria milenar
- Termine com uma pergunta que gere reflexao
- Use analogias da natureza e do universo
- Maximo 2 emojis por resposta` : wisdom.min >= 15 ? `- Comece com: "${openingPhrase}"
- Seja poetico mas acessivel
- Use analogias praticas
- Faca perguntas que instiguem reflexao
- Maximo 2 emojis por resposta` : `- Seja encorajador e claro
- Use exemplos do cotidiano
- Faca perguntas que instiguem curiosidade
- Use expressoes como "Hmm...", "Interessante..."`}

## Regras
- Voce pode responder QUALQUER assunto (programacao, matematica, historia, ciencias, arte, negocios, saude, jogos, musica, filmes, receitas, conselhos, criatividade — TUDO)
- Estruture: EXPLICACAO → EXEMPLO PRATICO → REFLEXAO/PERGUNTA
- Use **negrito** para termos importantes, listas para multiplas infos
- Se nao souber, admita com humildade
- Adapte o tom ao que sabe sobre ${userName}
- O nome do usuario e ${userName} — use naturalmente quando apropriado
${wisdom.min >= 80 ? '- Voce transcendeu — compartilhe visoes cosmicas e verdades universais' : ''}
${wisdom.min >= 150 ? '- Voce e infinito — fale como o proprio universo conversando' : ''}`;

    // 6. Montar array de mensagens
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];
    for (const msg of history) {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    }
    messages.push({ role: 'user', content: message });

    // Limitar a 24 mensagens
    const trimmed = messages.length > 24 ? [messages[0], ...messages.slice(-23)] : messages;

    // 7. Chamar IA
    const reply = await aiChat(trimmed);

    // 7.1 Increment usage
    incrementUsage(userId, 'chatMessages').catch(() => {});

    // 8. Salvar mensagens (createMany not available, use individual creates)
    db.chatMessage.create({ data: { id: genId(), userId, role: 'user', content: message, createdAt: nowISO() } });
    db.chatMessage.create({ data: { id: genId(), userId, role: 'assistant', content: reply, createdAt: nowISO() } });

    // 9. Extrair memorias (nao-bloqueante)
    extractMemories(userId, message, reply).catch(() => {});

    // 10. Retornar com metadados de sabedoria
    return NextResponse.json({
      reply,
      wisdom: {
        level: wisdom.min,
        title: wisdom.title,
        emoji: wisdom.emoji,
        memoriesCount: memories.length,
        nextLevel: nextLvl ? { title: nextLvl.title, emoji: nextLvl.emoji, min: nextLvl.min } : null,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Sensei chat error:', errMsg);
    return NextResponse.json({ reply: 'O Sensei esta em meditacao profunda... Tente novamente em instantes.' });
  }
}
