import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_TYPES = ['EXAM', 'HOMEWORK', 'SEMINAR', 'DELIVERY', 'CLASS', 'REVIEW', 'STUDY_SESSION', 'OTHER'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const existing = await db.calendarEvent.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, type, date, endDate, subjectId, isAllDay, color } = body;

    const data: any = {};
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (type && VALID_TYPES.includes(type)) data.type = type;
    if (date) data.date = new Date(date);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (subjectId === null) data.subjectId = null;
    if (typeof subjectId === 'string' && subjectId) {
      const subject = await db.subject.findFirst({ where: { id: subjectId, userId } });
      if (subject) data.subjectId = subjectId;
    }
    if (typeof isAllDay === 'boolean') data.isAllDay = isAllDay;
    if (typeof color === 'string' && color) data.color = color;
    if (color === null) data.color = null;

    const event = await db.calendarEvent.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const existing = await db.calendarEvent.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });
    }

    await db.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
