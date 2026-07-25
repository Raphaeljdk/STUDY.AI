import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [notebookCount, flashcardCount, dueFlashcards, totalCards, sessions, todaySessions, chatCount, masteredCards] = await Promise.all([
      db.notebook.count({ where: { userId } }),
      db.flashcard.count({ where: { userId, repetitions: { gt: 0 } } }),
      db.flashcard.count({ where: { userId, nextReview: { lte: now } } }),
      db.flashcard.count({ where: { userId } }),
      db.studySession.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        select: { duration: true, createdAt: true },
      }),
      db.studySession.findMany({
        where: { userId, createdAt: { gte: todayStart } },
        select: { duration: true },
      }),
      db.chatMessage.count({ where: { userId, role: 'user' } }),
      db.flashcard.count({ where: { userId, repetitions: { gte: 5 } } }),
    ]);

    // Weekly study time
    const weeklySeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
    const weeklyMinutes = Math.round(weeklySeconds / 60);
    const weeklyHours = Math.floor(weeklyMinutes / 60);
    const weeklyRemainder = weeklyMinutes % 60;
    const studyTime = weeklyHours > 0 ? `${weeklyHours}h${weeklyRemainder > 0 ? `${weeklyRemainder}m` : ''}` : `${weeklyMinutes}m`;

    // Today study time
    const todaySeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const todayMinutes = Math.round(todaySeconds / 60);

    // Daily breakdown for mini chart (last 7 days)
    const dailyData: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayLabel = dayStart.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayMinutes = Math.round(
        sessions
          .filter(s => s.createdAt >= dayStart && s.createdAt < dayEnd)
          .reduce((sum, s) => sum + s.duration, 0) / 60
      );
      dailyData.push({ day: dayLabel, minutes: dayMinutes });
    }

    // Streak calculation
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const hasSession = sessions.some(s => s.createdAt >= dayStart && s.createdAt < dayEnd);
      if (hasSession) streak++;
      else if (i > 0) break;
    }

    return NextResponse.json({
      notebooks: notebookCount,
      flashcards: totalCards,
      studiedFlashcards: flashcardCount,
      dueFlashcards,
      masteredCards,
      studyTime,
      todayMinutes,
      chatCount,
      streak,
      dailyData,
      weeklySessions: sessions.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
