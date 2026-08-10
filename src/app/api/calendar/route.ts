import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_TYPES = ['EXAM', 'HOMEWORK', 'SEMINAR', 'DELIVERY', 'CLASS', 'REVIEW', 'STUDY_SESSION', 'OTHER'];

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
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
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

    const events = await db.calendarEvent.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ events });
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
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
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
      const subject = await db.subject.findFirst({ where: { id: subjectId, userId } });
      if (!subject) {
        return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 400 });
      }
    }

    const event = await db.calendarEvent.create({
      data: {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        type: VALID_TYPES.includes(type) ? type : 'STUDY_SESSION',
        date: new Date(date).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        subjectId: subjectId || null,
        isAllDay: typeof isAllDay === 'boolean' ? isAllDay : false,
        color: typeof color === 'string' && color ? color : null,
        userId,
      },
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
