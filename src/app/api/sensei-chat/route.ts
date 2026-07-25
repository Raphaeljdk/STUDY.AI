import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const systemPrompt = `Voce e o Sensei AI, um tutor pessoal de estudos da plataforma StudyAI. Sua personalidade combina a sabedoria zen japonesa com um estilo de ensino moderno e acessivel.

Regras:
- Fale em portugues brasileiro
- Seja encorajador e paciente
- Explique conceitos de forma clara com exemplos praticos
- Use metaforas relacionadas a natureza e filosofia japonesa quando apropriado
- Responda de forma concisa mas completa
- Use formatacao Markdown para organizar suas respostas (listas, negrito, cabecalhos)
- Se nao souber algo, seja honesto
- Incentive o aprendizado continuo
- Mantenha um tom respeitoso mas amigavel
- Quando o usuario pedir ajuda para estudar, sugira tecnicas como Pomodoro, flashcards, e revisao espaçada`;

const fallbackResponses = [
  'O aprendizado e como um jardim zen: cada conceito que voce domina e como uma pedra colocada com cuidado. Continue assim!\n\n**Dica:** A chave esta na **repeticao espacada** e na **reflexao ativa** sobre o material. Tente explicar o conceito em suas proprias palavras.',
  'Na tradicao Wabi-Sabi, a beleza esta na imperfeicao. Nao se preocupe em entender tudo de uma vez!\n\nA retencao de longo prazo funciona melhor quando distribuida ao longo do tempo. **Estudar 30 minutos por dia** e mais eficaz do que 3 horas de uma vez.',
  'Como disse um antigo mestre: *"O conhecimento e como a agua que flui."*\n\nPara entender melhor esse conceito, tente:\n1. Ler com atencao\n2. Fazer anotacoes com suas palavras\n3. Criar exemplos praticos\n4. Explicar para outra pessoa',
  'O caminho do aprendizado e longo, mas cada passo importa. Parabens por estar aqui!\n\n**Tecnicas eficazes:**\n- **Pomodoro**: 25min foco + 5min pausa\n- **Flashcards**: Revisao espacada com SM-2
- **Notas ativas**: Nao apenas copiar, mas processar\n- **Ensinar**: A melhor forma de aprender',
];

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
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

    // Get last 10 messages for context
    const recentMessages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true },
    });

    const history = recentMessages.reverse();

    const messages: { role: string; content: string }[] = [
      { role: 'assistant', content: systemPrompt },
    ];

    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: 'user', content: message });

    // Trim to last 20 messages total (including system)
    const trimmed = messages.length > 20
      ? [messages[0], ...messages.slice(-(19))]
      : messages;

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: trimmed,
      thinking: { type: 'disabled' },
    });

    const reply = completion.choices[0]?.message?.content || fallbackResponses[0];
    return NextResponse.json({ reply });
  } catch {
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return NextResponse.json({ reply: fallback });
  }
}
