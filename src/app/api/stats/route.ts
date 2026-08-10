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
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const now = new Date();
    const nowISO = now.toISOString();
    const oneWeekAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStartISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Parallel data fetches
    const [
      user,
      subjectCount,
      pendingTasksCount,
      tasksCompletedToday,
      flashcardDueCount,
      totalFlashcards,
      notebookCount,
      studiedFlashcards,
      masteredCards,
      sessions,
      allSessions,
      todaySessions,
      chatCount,
      inProgressGoals,
      completedGoalsToday,
      weeklySessions,
    ] = await Promise.all([
      // User gamification data
      db.user.findUnique({
        where: { id: userId },
        select: {
          xp: true, level: true, currentStreak: true, longestStreak: true,
          totalStudyMinutes: true, totalSessions: true, totalTasksCompleted: true,
          totalFlashcardsReviewed: true, totalQuestionsAnswered: true,
        },
      }),
      // Subject stats
      db.subject.count({ where: { userId, isActive: true } }),
      // Pending tasks
      db.task.count({ where: { userId, status: 'PENDING' } }),
      // Tasks completed today
      db.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: todayStartISO } } }),
      // Flashcards due
      db.flashcard.count({ where: { userId, nextReview: { lte: nowISO } } }),
      // Total flashcards
      db.flashcard.count({ where: { userId } }),
      // Notebook count
      db.notebook.count({ where: { userId } }),
      // Studied flashcards (repetitions > 0)
      db.flashcard.count({ where: { userId, repetitions: { gt: 0 } } }),
      // Mastered cards (repetitions >= 5)
      db.flashcard.count({ where: { userId, repetitions: { gte: 5 } } }),
      // Sessions this week
      db.studySession.findMany({
        where: { userId, createdAt: { gte: oneWeekAgoISO } },
        select: { duration: true, createdAt: true },
      }),
      // All sessions (for streak)
      db.studySession.findMany({
        where: { userId },
        select: { createdAt: true },
      }),
      // Today sessions
      db.studySession.findMany({
        where: { userId, createdAt: { gte: todayStartISO } },
        select: { duration: true },
      }),
      // Chat count
      db.chatMessage.count({ where: { userId, role: 'user' } }),
      // In-progress goals
      db.goal.count({ where: { userId, status: 'IN_PROGRESS' } }),
      // Goals completed today
      db.goal.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: todayStartISO } } }),
      // Weekly session count
      db.studySession.count({ where: { userId, createdAt: { gte: oneWeekAgoISO } } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Weekly study time calculation
    const weeklySeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
    const weeklyMinutes = Math.round(weeklySeconds / 60);
    const weeklyHours = Math.floor(weeklyMinutes / 60);
    const weeklyRemainder = weeklyMinutes % 60;
    const studyTime = weeklyHours > 0
      ? `${weeklyHours}h${weeklyRemainder > 0 ? `${weeklyRemainder}m` : ''}`
      : `${weeklyMinutes}m`;

    // Today study time
    const todaySeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const todayStudyMinutes = Math.round(todaySeconds / 60);

    // Streak calculation
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const hasSession = allSessions.some(s => s.createdAt >= dayStart && s.createdAt < dayEnd);
      if (hasSession) streak++;
      else if (i > 0) break;
    }

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

    // Level progress
    const currentLevelXP = user.level * 100;
    const nextLevelXP = (user.level + 1) * 100;
    const xpInCurrentLevel = user.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const levelProgress = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

    // Subject stats with task counts
    const subjectStats = await db.subject.findMany({
      where: { userId, isActive: true },
      select: {
        id: true, name: true, color: true, icon: true,
        _count: { select: { tasks: true, topics: true, sessions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      // Legacy stats (preserved)
      notebooks: notebookCount,
      flashcards: totalFlashcards,
      studiedFlashcards,
      dueFlashcards: flashcardDueCount,
      masteredCards,
      studyTime,
      todayMinutes: todayStudyMinutes,
      chatCount,
      streak,
      dailyData,
      weeklySessions: weeklySessions,

      // New Fase 1 stats
      // Study time
      totalStudyMinutes: user.totalStudyMinutes,
      todayStudyMinutes,
      weeklyStudyMinutes: weeklyMinutes,

      // Subject stats
      subjectCount,
      subjectStats,

      // Task stats
      tasksCompletedToday,
      pendingTasksCount,
      totalTasksCompleted: user.totalTasksCompleted,

      // Goal progress
      inProgressGoals,
      completedGoalsToday,

      // Gamification
      xp: user.xp,
      level: user.level,
      levelProgress,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,

      // Flashcard stats (deduplicated)
      flashcardDueCount,
      masteredCards,

      // Session stats
      totalSessions: user.totalSessions,

      // AI recommendations (stub)
      aiRecommendations: [
        { type: 'study', message: 'Revise os flashcards vencidos para manter seu ritmo de estudo.' },
        { type: 'task', message: pendingTasksCount > 0
          ? `Voce tem ${pendingTasksCount} tarefa(s) pendente(s). Priorize as mais urgentes.`
          : 'Todas as tarefas estao em dia. Bom trabalho!' },
        { type: 'streak', message: streak > 0
          ? `Continue estudando para manter sua sequencia de ${streak} dia(s)!`
          : 'Comece a estudar hoje para iniciar sua sequencia!' },
      ],
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
