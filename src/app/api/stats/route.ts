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

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [notebookCount, flashcardCount, dueFlashcards, sessions] = await Promise.all([
      db.notebook.count({ where: { userId } }),
      db.flashcard.count({ where: { userId } }),
      db.flashcard.count({ where: { userId, nextReview: { lte: new Date() } } }),
      db.studySession.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        select: { duration: true },
      }),
    ]);

    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMinutes = Math.round(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hoursDisplay = hours > 0 ? `${hours}h${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;

    return NextResponse.json({
      notebooks: notebookCount,
      flashcards: flashcardCount,
      dueFlashcards,
      studyTime: hoursDisplay,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
