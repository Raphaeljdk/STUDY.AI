import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/zai';

// POST /api/teach/guide - generate a study guide for a topic (Feynman preparation)
export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'teach');
    if (denied) return denied;
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { topic, subject, difficulty } = body;

    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: 'Topico e obrigatorio (minimo 2 caracteres)' }, { status: 400 });
    }

    const difficultyLabel = difficulty === 'basico' ? 'basico'
      : difficulty === 'intermediario' ? 'intermediario'
      : difficulty === 'avancado' ? 'avancado'
      : 'intermediario';

    // Fetch notebook context for guide personalization
    let notebookContext = '';
    try {
      let relevantNotebookIds: string[] = [];
      if (subject) {
        const matchingTags = await db.notebookTag.findMany({
          where: { userId, name: { contains: subject } },
          select: ['notebookId'],
        });
        relevantNotebookIds = matchingTags.map((t: any) => t.notebookId);
      }

      const allUserNotebooks = await db.notebook.findMany({
        where: { userId },
        select: ['id', 'title'],
      });

      const titleMatched = allUserNotebooks.filter((nb: any) => {
        if (!subject && !topic) return false;
        const titleLower = (nb.title || '').toLowerCase();
        return (
          (subject && titleLower.includes(subject.toLowerCase())) ||
          (topic && titleLower.includes(topic.toLowerCase()))
        ) && !relevantNotebookIds.includes(nb.id);
      });

      const allRelevant = [
        ...allUserNotebooks.filter((nb: any) => relevantNotebookIds.includes(nb.id)),
        ...titleMatched,
      ].slice(0, 3);

      for (const nb of allRelevant) {
        const pages = await db.notebookPage.findMany({
          where: { notebookId: nb.id, textContent: { not: '' } },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: ['textContent'],
        });
        if (pages.length > 0) {
          notebookContext += `\nCaderno "${nb.title}":\n`;
          notebookContext += pages.map((p: any) => (p.textContent || '').substring(0, 400)).join('\n---\n');
        }
      }
    } catch (err) {
      console.warn('[Teach Guide] Error fetching notebook context:', err);
    }

    const notebookSection = notebookContext
      ? `\n\nO aluno tem as seguintes notas em seus cadernos (personalize o guia baseado nisso):\n${notebookContext}`
      : '';

    const aiResponse = await aiChat([
      {
        role: 'system',
        content: `Voce e um especialista em metodos de estudo e Tecnica de Feynman. Seu trabalho e criar um guia de estudo que ajude um aluno a ENTENDER profundamente um topico, preparando-o para poder EXPLICAR esse topico para outra pessoa.

O guia deve ser para o nivel: ${difficultyLabel}
Materia: ${subject || 'Geral'}${notebookSection}

IMPORTANTE: O objetivo final do guia e preparar o aluno para ENSINAR esse conceito (Tecnica de Feynman). Cada secao deve ajudar o aluno a internalizar o conhecimento de forma que consiga explicar com clareza.

Responda APENAS com um JSON valido (sem markdown, sem code fences) com estes campos:
{
  "outline": ["item 1 do roteiro de estudo", "item 2 do roteiro de estudo", "item 3 do roteiro de estudo", "item 4"],
  "keyConcepts": ["conceito chave 1 com breve descricao", "conceito chave 2 com breve descricao", "conceito chave 3 com breve descricao", "conceito chave 4 com breve descricao"],
  "practiceQuestions": ["pergunta para praticar a explicacao 1", "pergunta para praticar a explicacao 2", "pergunta para praticar a explicacao 3"],
  "commonMistakes": ["erro comum 1 e como evitar", "erro comum 2 e como evitar", "erro comum 3 e como evitar"],
  "resources": ["recurso ou dica de estudo 1", "recurso ou dica de estudo 2", "recurso ou dica de estudo 3"]
}

Tudo em portugues brasileiro. Seja pratico e direto.`,
      },
      {
        role: 'user',
        content: `Crie um guia de estudo para o topico: "${topic}"
Materia: ${subject || 'Geral'}
Nivel: ${difficultyLabel}

O guia deve me preparar para explicar esse conceito usando a Tecnica de Feynman.`,
      },
    ]);

    let guide: any = null;
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      guide = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: 'Erro ao gerar o guia. Tente novamente.' }, { status: 500 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('[Teach Guide] Route error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('GROQ_API_KEY') || msg.includes('timeout') || msg.includes('network') || msg.includes('fetch')) {
      return NextResponse.json({ error: 'Servidor de IA indisponivel. Tente novamente em alguns segundos.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
