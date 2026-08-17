import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { canAccess, FEATURE_MIN_PLAN } from '@/lib/plan-gating';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'dashboardFull')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['dashboardFull'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    const now = new Date();
    const nowIsoStr = now.toISOString();
    const oneWeekAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStartISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Synchronous db calls (no Promise.all needed)
    // User gamification data
    const userData = await db.user.findUnique({
      where: { id: userId },
      select: [
        'xp', 'level', 'currentStreak', 'longestStreak',
        'totalStudyMinutes', 'totalSessions', 'totalTasksCompleted',
        'totalFlashcardsReviewed', 'totalQuestionsAnswered',
      ],
    });
    // Subject stats
    const subjectCount = await db.subject.count({ where: { userId, isActive: true } });
    // Pending tasks
    const pendingTasksCount = await db.task.count({ where: { userId, status: 'PENDING' } });
    // Tasks completed today
    const tasksCompletedToday = await db.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: todayStartISO } } });
    // Flashcards due
    const flashcardDueCount = await db.flashcard.count({ where: { userId, nextReview: { lte: nowIsoStr } } });
    // Total flashcards
    const totalFlashcards = await db.flashcard.count({ where: { userId } });
    // Notebook count
    const notebookCount = await db.notebook.count({ where: { userId } });
    // Studied flashcards (repetitions > 0)
    const studiedFlashcards = await db.flashcard.count({ where: { userId, repetitions: { gt: 0 } } });
    // Mastered cards (repetitions >= 5)
    const masteredCards = await db.flashcard.count({ where: { userId, repetitions: { gte: 5 } } });
    // Sessions this week
    const sessions = await db.studySession.findMany({
      where: { userId, createdAt: { gte: oneWeekAgoISO } },
      select: ['duration', 'createdAt'],
    });
    // All sessions (for streak)
    const allSessions = await db.studySession.findMany({
      where: { userId },
      select: ['createdAt'],
    });
    // Today sessions
    const todaySessions = await db.studySession.findMany({
      where: { userId, createdAt: { gte: todayStartISO } },
      select: ['duration'],
    });
    // Chat count
    const chatCount = await db.chatMessage.count({ where: { userId, role: 'user' } });
    // In-progress goals
    const inProgressGoals = await db.goal.count({ where: { userId, status: 'IN_PROGRESS' } });
    // Goals completed today
    const completedGoalsToday = await db.goal.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: todayStartISO } } });
    // Weekly session count
    const weeklySessions = await db.studySession.count({ where: { userId, createdAt: { gte: oneWeekAgoISO } } });

    if (!userData) {
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
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString();
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).toISOString();
      const hasSession = allSessions.some(s => s.createdAt >= dayStart && s.createdAt < dayEnd);
      if (hasSession) streak++;
      else if (i > 0) break;
    }

    // Daily breakdown for mini chart (last 7 days)
    const dailyData: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString();
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).toISOString();
      const dayLabel = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayMinutes = Math.round(
        sessions
          .filter(s => s.createdAt >= dayStart && s.createdAt < dayEnd)
          .reduce((sum, s) => sum + s.duration, 0) / 60
      );
      dailyData.push({ day: dayLabel, minutes: dayMinutes });
    }

    // Level progress
    const currentLevelXP = userData.level * 100;
    const nextLevelXP = (userData.level + 1) * 100;
    const xpInCurrentLevel = userData.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const levelProgress = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

    // Subject stats with task counts (replaces _count with separate queries)
    const subjects = await db.subject.findMany({
      where: { userId, isActive: true },
      select: ['id', 'name', 'color', 'icon', 'sortOrder'],
      orderBy: { sortOrder: 'asc' },
    });
    const subjectStats = await Promise.all(subjects.map(async s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      icon: s.icon,
      _count: {
        tasks: await db.task.count({ where: { subjectId: s.id } }),
        topics: await db.topic.count({ where: { subjectId: s.id } }),
      },
    })));

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
      totalStudyMinutes: userData.totalStudyMinutes,
      todayStudyMinutes,
      weeklyStudyMinutes: weeklyMinutes,

      // Subject stats
      subjectCount,
      subjectStats,

      // Task stats
      tasksCompletedToday,
      pendingTasksCount,
      totalTasksCompleted: userData.totalTasksCompleted,

      // Goal progress
      inProgressGoals,
      completedGoalsToday,

      // Gamification
      xp: userData.xp,
      level: userData.level,
      levelProgress,
      currentStreak: userData.currentStreak,
      longestStreak: userData.longestStreak,

      // Flashcard stats (deduplicated)
      flashcardDueCount,
      masteredCards,

      // Session stats
      totalSessions: userData.totalSessions,

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
