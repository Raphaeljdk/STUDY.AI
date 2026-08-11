import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

const VALID_TYPES = ['EXAM', 'HOMEWORK', 'SEMINAR', 'DELIVERY', 'CLASS', 'REVIEW', 'STUDY_SESSION', 'OTHER'];

async function attachSubjects(events: any[]) {
  const subjectIds = [...new Set(events.map((e: any) => e.subjectId).filter(Boolean))];
  const subjects = subjectIds.length > 0
    ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: ['id', 'name', 'color', 'icon'] })
    : [];
  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  return events.map((e: any) => ({ ...e, subject: e.subjectId ? subjectMap.get(e.subjectId) || null : null }));
}

export async function GET(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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

    const events = await db.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const eventsWithSubjects = await attachSubjects(events);

    return NextResponse.json({ events: eventsWithSubjects });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

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

    const { title, description, type, date, endDate, subjectId, isAllDay, color } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Data obrigatoria' }, { status: 400 });
    }

    // Validate subjectId if provided
    if (subjectId) {
      const subject = await db.subject.findFirst({ where: { id: subjectId, userId } });
      if (!subject) {
        return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 400 });
      }
    }

    const event = await db.calendarEvent.create({
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
    const eventsWithSubjects = await attachSubjects([event]);

    return NextResponse.json({ event: eventsWithSubjects[0] }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
