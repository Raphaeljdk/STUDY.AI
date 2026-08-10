import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

const VALID_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'SUBJECT', 'EXAM'];
const VALID_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'];

function attachSubjects(goals: any[]) {
  const subjectIds = [...new Set(goals.map((g: any) => g.subjectId).filter(Boolean))];
  const subjects = subjectIds.length > 0
    ? db.subject.findMany({ where: { id: { in: subjectIds } }, select: ['id', 'name', 'color', 'icon'] })
    : [];
  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  return goals.map((g: any) => ({ ...g, subject: g.subjectId ? subjectMap.get(g.subjectId) || null : null }));
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = { userId };
    if (type && VALID_TYPES.includes(type)) {
      where.type = type;
    }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    const goals = db.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const goalsWithSubjects = attachSubjects(goals);

    return NextResponse.json({ goals: goalsWithSubjects });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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

    const { title, description, type, targetValue, unit, subjectId, targetDate } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }

    // Validate subjectId if provided
    if (subjectId) {
      const subject = db.subject.findFirst({ where: { id: subjectId, userId } });
      if (!subject) {
        return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 400 });
      }
    }

    const goal = db.goal.create({
      data: {
        id: genId(),
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        type: VALID_TYPES.includes(type) ? type : 'DAILY',
        targetValue: typeof targetValue === 'number' ? targetValue : null,
        unit: typeof unit === 'string' ? unit : null,
        subjectId: subjectId || null,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        userId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    // Attach subject (was include)
    const goalsWithSubjects = attachSubjects([goal]);

    return NextResponse.json({ goal: goalsWithSubjects[0] }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
