import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db } from '@/lib/db';

/**
 * GET /api/calendar/reminders
 * Returns upcoming calendar events within the next 7 days that have reminders.
 * Excludes events that already happened (before today).
 */
export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get today's start (YYYY-MM-DD 00:00:00)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekEnd = sevenDaysFromNow.toISOString();

    const events = await db.calendarEvent.findMany({
      where: {
        userId,
        date: { gte: todayStart, lte: weekEnd },
      },
      orderBy: { date: 'asc' },
    });

    // Attach subject names
    const subjectIds = [...new Set(events.map((e: any) => e.subjectId).filter(Boolean))];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: ['id', 'name', 'color'] })
      : [];
    const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));

    const eventsWithSubjects = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      endDate: e.endDate,
      type: e.type,
      color: e.color,
      isAllDay: e.isAllDay,
      subject: e.subjectId ? subjectMap.get(e.subjectId) || null : null,
    }));

    return NextResponse.json({ events: eventsWithSubjects });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
