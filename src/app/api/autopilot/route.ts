import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/zai';

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { exam, date, subjects, studyHoursPerDay, currentLevel, weakAreas } = body;

    if (!exam || typeof exam !== 'string' || !exam.trim()) {
      return NextResponse.json({ error: 'Nome da prova obrigatorio' }, { status: 400 });
    }

    // Gather user's existing data for context (no include — separate queries)
    const userSubjects = await db.subject.findMany({
      where: { userId },
    });

    // Get topics for each subject separately
    const subjectsContext = await Promise.all(userSubjects.map(async s => {
      const topics = await db.topic.findMany({ select: ['name', 'mastery'], where: { subjectId: s.id } });
      return {
        name: s.name,
        topics: topics.map(t => ({ name: t.name, mastery: t.mastery })),
      };
    }));

    const studyHours = typeof studyHoursPerDay === 'number' ? studyHoursPerDay : 3;
    const level = typeof currentLevel === 'string' ? currentLevel : 'intermediario';
    const areas = Array.isArray(weakAreas) ? weakAreas.join(', ') : '';
    const subjectsStr = Array.isArray(subjects) && subjects.length > 0 ? subjects.join(', ') : userSubjects.map(s => s.name).join(', ');

    const daysUntilExam = date
      ? Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 30;

    const aiResponse = await aiChat([
      {
        role: 'system',
        content: `Voce e um estrategista de estudos que cria planos de estudo personalizados. O plano deve ser realista e eficaz. Responda APENAS com um JSON valido (sem markdown) com os campos: { "title": "titulo do plano", "summary": "resumo de 2-3 frases da estrategia", "totalDays": ${daysUntilExam}, "dailyHours": ${studyHours}, "phases": [{ "name": "nome da fase", "days": "duracao em dias", "focus": "foco principal", "activities": ["atividade 1", "atividade 2"], "subjects": ["materia 1"] }], "weeklySchedule": [{ "day": "Segunda", "blocks": [{ "time": "08:00-10:00", "subject": "materia", "activity": "atividade" }] }], "milestones": [{ "day": 7, "description": "marco alcançado" }], "tips": ["dica 1", "dica 2", "dica 3"], "estimatedCoverage": "porcentagem estimada de cobertura do conteudo" }. No maximo 4 fases, 7 dias na weeklySchedule, 6 milestones, 5 dicas. Tudo em portugues brasileiro.`,
      },
      {
        role: 'user',
        content: `Crie um plano de estudo para a prova de "${exam.trim()}". Materias: ${subjectsStr || 'todas'}. Dias ate a prova: ${daysUntilExam}. Horas por dia: ${studyHours}. Nivel atual: ${level}.${areas ? ` Areas fracas: ${areas}.` : ''} Contexto das minhas materias: ${JSON.stringify(subjectsContext)}.`,
      },
    ]);

    let plan: any;
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plan = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: 'Erro ao gerar plano com IA' }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
