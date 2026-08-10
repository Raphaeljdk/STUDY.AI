import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

const VALID_TYPES = ['EXAM', 'HOMEWORK', 'SEMINAR', 'DELIVERY', 'CLASS', 'REVIEW', 'STUDY_SESSION', 'OTHER'];

function attachSubject(event: any) {
  if (!event?.subjectId) return { ...event, subject: null };
  const subject = db.subject.findUnique({ where: { id: event.subjectId }, select: ['id', 'name', 'color', 'icon'] });
  return { ...event, subject: subject || null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const existing = db.calendarEvent.findFirst({ where: { id, userId } });
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

    const data: any = { updatedAt: nowISO() };
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (type && VALID_TYPES.includes(type)) data.type = type;
    if (date) data.date = new Date(date).toISOString();
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate).toISOString() : null;
    if (subjectId === null) data.subjectId = null;
    if (typeof subjectId === 'string' && subjectId) {
      const subject = db.subject.findFirst({ where: { id: subjectId, userId } });
      if (subject) data.subjectId = subjectId;
    }
    if (typeof isAllDay === 'boolean') data.isAllDay = isAllDay ? 1 : 0;
    if (typeof color === 'string' && color) data.color = color;
    if (color === null) data.color = null;

    const event = db.calendarEvent.update({
      where: { id },
      data,
    });

    const eventWithSubject = attachSubject(event);

    return NextResponse.json({ event: eventWithSubject });
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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const existing = db.calendarEvent.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Evento nao encontrado' }, { status: 404 });
    }

    db.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
