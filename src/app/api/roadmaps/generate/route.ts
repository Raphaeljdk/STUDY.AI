import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { aiChatJSON, safeParseJSON } from '@/lib/zai';

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'roadmapAI');
    if (denied) return denied;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { topic } = body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Topico obrigatorio' }, { status: 400 });
    }

    const prompt = `Voce e um mentor tecnico senior com 15+ anos de experiencia em engenharia de software e educacao tecnologica. Crie um roadmap de aprendizagem DETALHADO e de NIVEL SENIOR para o tema: "${topic.trim()}".

REGRAS ESTRITAS:
1. Crie entre 10 e 15 etapas, progressivamente mais complexas
2. Cada etapa DEVE ter:
   - "name": titulo tecnico preciso (nao generico)
   - "description": explicacao detalhada de 3-4 frases cobrindo conceitos-chave, ferramentas, boas praticas e armadilhas comuns. Nivel senior.
   - "estimatedHours": numero realista de horas (entre 3 e 20)
   - "difficulty": um de ["Fundamental", "Intermediario", "Avancado", "Especialista"]
3. A progressao deve ir de fundamentos solidos ate topicos de ponta
4. Inclua referencias a ferramentas reais, frameworks e padroes da industria
5. Descreva NAO SO o que estudar, mas COMO aplicar em projetos reais
6. Inclua pelo menos 2 etapas de nivel "Especialista"
7. As descricoes devem ser em portugues brasileiro, tecnicamente precisas

Responda APENAS com um JSON valido, sem markdown, sem code blocks, sem explicacao.
O JSON deve ser um objeto com um campo "steps" contendo o array de etapas.
Exemplo de formato:
{"steps":[{"name":"...","description":"...","estimatedHours":8,"difficulty":"Fundamental"}]}`;

    const aiResponse = await aiChatJSON([
      { role: 'user', content: prompt },
    ], { maxTokens: 4000, temperature: 0.5 });

    const parsed = safeParseJSON(aiResponse);
    if (!parsed || !Array.isArray(parsed.steps)) {
      return NextResponse.json({ error: 'Erro ao gerar trilha. Tente novamente.' }, { status: 500 });
    }

    // Validate steps structure
    const validDifficulties = ['Fundamental', 'Intermediario', 'Avancado', 'Especialista'];
    const validated = parsed.steps.filter((s: any) =>
      s.name && s.description && s.estimatedHours && s.difficulty
    ).map((s: any) => ({
      name: String(s.name).trim(),
      description: String(s.description).trim(),
      estimatedHours: Number(s.estimatedHours) || 5,
      difficulty: validDifficulties.includes(s.difficulty) ? s.difficulty : 'Intermediario',
    }));

    if (validated.length === 0) {
      return NextResponse.json({ error: 'Erro ao gerar trilha. Tente novamente.' }, { status: 500 });
    }

    return NextResponse.json({ steps: validated });
  } catch (error) {
    console.error('Roadmap generate error:', error);
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
