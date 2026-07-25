import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const systemPrompt = `Voce e um gerador de flashcards educacionais. A partir do conteudo fornecido, gere flashcards de alta qualidade.

Regras:
- Responda APENAS com um JSON valido, sem nenhum texto adicional
- O JSON deve ser um array de objetos com "front" e "back"
- "front" deve ser uma pergunta clara e concisa
- "back" deve ser a resposta completa mas objetiva
- Gere entre 3 a 8 flashcards dependendo do conteudo
- Priorize os conceitos mais importantes
- Use linguagem clara e didatica
- Em portuguues brasileiro`;

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

export async function POST(request: Request) {
  try {
    const { content, count = 5 } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Conteudo e obrigatorio' }, { status: 400 });
    }

    const zai = await getZAI();

    const plainContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const truncated = plainContent.substring(0, 3000);

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: `Gere ${count} flashcards a partir deste conteudo:\n\n${truncated}` },
      ],
      thinking: { type: 'disabled' },
    });

    let reply = completion.choices[0]?.message?.content || '[]';
    reply = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const flashcards = JSON.parse(reply);
      if (Array.isArray(flashcards)) {
        const valid = flashcards.filter((f: any) => f.front && f.back).map((f: any) => ({ front: f.front.trim(), back: f.back.trim() }));
        return NextResponse.json({ flashcards: valid });
      }
    } catch {}

    return NextResponse.json({ flashcards: [] });
  } catch {
    return NextResponse.json({ flashcards: [] });
  }
}
