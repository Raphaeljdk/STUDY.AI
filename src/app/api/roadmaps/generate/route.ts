import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import ZAI from 'z-ai-web-dev-sdk';

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

    const zai = await ZAI.create();

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

Responda APENAS com um JSON array valido, sem markdown, sem code blocks, sem explicacao.
Exemplo de formato:
[{"name":"...","description":"...","estimatedHours":8,"difficulty":"Fundamental"}]`;

    const response = await zai.chat.completions.create({
      model: 'glm-4-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    let content = response.choices[0]?.message?.content || '';

    // Clean up markdown code blocks if present
    content = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let steps: any[];
    try {
      steps = JSON.parse(content);
    } catch {
      // Try to extract JSON array from the response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        steps = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: 'Erro ao gerar trilha. Tente novamente.' }, { status: 500 });
      }
    }

    // Validate steps structure
    const validDifficulties = ['Fundamental', 'Intermediario', 'Avancado', 'Especialista'];
    const validated = steps.filter((s: any) =>
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
  } catch (error: any) {
    console.error('Roadmap generate error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
