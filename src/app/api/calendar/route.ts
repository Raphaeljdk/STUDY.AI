import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

const VALID_TYPES = ['EXAM', 'HOMEWORK', 'SEMINAR', 'DELIVERY', 'CLASS', 'REVIEW', 'STUDY_SESSION', 'OTHER'];

function attachSubjects(events: any[]) {
  const subjectIds = [...new Set(events.map((e: any) => e.subjectId).filter(Boolean))];
  const subjects = subjectIds.length > 0
    ? db.subject.findMany({ where: { id: { in: subjectIds } }, select: ['id', 'name', 'color', 'icon'] })
    : [];
  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  return events.map((e: any) => ({ ...e, subject: e.subjectId ? subjectMap.get(e.subjectId) || null : null }));
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
    const month = searchParams.get('month'); // YYYY-MM
    const weekStart = searchParams.get('weekStart'); // ISO date string
    const weekEnd = searchParams.get('weekEnd'); // ISO date string

    const where: any = { userId };

    if (month) {
      // Filter by month: first day 00:00 to last day 23:59
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1).toISOString();
      const endDate = new Date(year, m, 0, 23, 59, 59, 999).toISOString();
      where.date = { gte: startDate, lte: endDate };
    } else if (weekStart && weekEnd) {
      where.date = {
        gte: new Date(weekStart).toISOString(),
        lte: new Date(weekEnd).toISOString(),
      };
    }

    const events = db.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const eventsWithSubjects = attachSubjects(events);

    return NextResponse.json({ events: eventsWithSubjects });
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

    const { title, description, type, date, endDate, subjectId, isAllDay, color } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Data obrigatoria' }, { status: 400 });
    }

    // Validate subjectId if provided
    if (subjectId) {
      const subject = db.subject.findFirst({ where: { id: subjectId, userId } });
      if (!subject) {
        return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 400 });
      }
    }

    const event = db.calendarEvent.create({
      data: {
        id: genId(),
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        type: VALID_TYPES.includes(type) ? type : 'STUDY_SESSION',
        date: new Date(date).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        subjectId: subjectId || null,
        isAllDay: typeof isAllDay === 'boolean' ? (isAllDay ? 1 : 0) : 0,
        color: typeof color === 'string' && color ? color : null,
        userId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    // Attach subject (was include)
    const eventsWithSubjects = attachSubjects([event]);

    return NextResponse.json({ event: eventsWithSubjects[0] }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
