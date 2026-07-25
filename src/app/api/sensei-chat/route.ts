import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const systemPrompt = `Você é o Sensei AI, um tutor pessoal de estudos da plataforma StudyAI. Sua personalidade combina a sabedoria zen japonesa com um estilo de ensino moderno e acessível.

Regras:
- Fale em português brasileiro
- Seja encorajador e paciente
- Explique conceitos de forma clara com exemplos
- Use metáforas relacionadas à natureza e filosofia japonesa quando apropriado
- Responda de forma concisa mas completa
- Se não souber algo, seja honesto
- Incentive o aprendizado contínuo
- Mantenha um tom respeitoso mas amigável`;

const fallbackResponses = [
  'O aprendizado é como um jardim zen: cada conceito que você domina é como uma pedra colocada com cuidado. Continue assim! Sobre sua pergunta, a chave está na repetição espaçada e na reflexão ativa sobre o material. Tente explicar o conceito em suas próprias palavras.',
  'Na tradição Wabi-Sabi, a beleza está na imperfeição. Não se preocupe em entender tudo de uma vez! A retenção de longo prazo funciona melhor quando distribuída ao longo do tempo. Estudar 30 minutos por dia é mais eficaz do que 3 horas de uma vez.',
  'Como disse um antigo mestre: "O conhecimento é como a água que flui." Para entender melhor esse conceito, tente ler com atenção, fazer anotações com suas palavras, criar exemplos práticos e explicar para outra pessoa.',
  'O caminho do aprendizado é longo, mas cada passo importa. Parabéns por estar aqui! A melhor forma de organizar seus estudos é definir metas claras, usar Pomodoro, revisar regularmente e testar seu conhecimento.',
];

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    const zai = await getZAI();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    });

    const reply = completion.choices[0]?.message?.content || fallbackResponses[0];
    return NextResponse.json({ reply });
  } catch {
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return NextResponse.json({ reply: fallback });
  }
}
