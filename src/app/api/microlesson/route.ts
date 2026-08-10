import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/zai';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
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
        content: `Voce e um professor que cria micro-aulas de 60 segundos. O conteudo deve ser conciso, direto e memoravel. Crie uma micro-aula sobre o topico solicitado. Responda APENAS com um JSON valido (sem markdown) com os campos: { "title": "titulo chamativo (max 8 palavras)", "content": "conteudo da micro-aula em markdown, maximo 200 palavras, com exemplos praticos e analogias", "keyPoint": "ponto-chave principal em 1 frase", "quiz": { "question": "pergunta rapida sobre o conteudo", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0 }, "emoji": "emoji representativo", "tags": ["tag1", "tag2", "tag3"] }. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Crie uma micro-aula de 60 segundos sobre: ${topic.trim()}.${contextStr ? ` Contexto adicional: ${contextStr}` : ''}`,
      },
    ]);

    let lesson: any;
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      lesson = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: 'Erro ao gerar micro-aula com IA' }, { status: 500 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
