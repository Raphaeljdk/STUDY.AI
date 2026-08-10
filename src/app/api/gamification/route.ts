import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, sqlite } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const userData = db.user.findUnique({
      where: { id: userId },
      select: [
        'xp', 'level', 'currentStreak', 'longestStreak', 'lastStudyDate',
        'totalStudyMinutes', 'totalSessions', 'totalTasksCompleted',
        'totalFlashcardsReviewed', 'totalQuestionsAnswered',
      ],
    });

    if (!userData) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Level progress
    const currentLevelXP = userData.level * 100;
    const nextLevelXP = (userData.level + 1) * 100;
    const xpInCurrentLevel = userData.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

    // Achievement count
    const unlockedCount = db.userAchievement.count({ where: { userId } });
    const totalAchievements = db.achievement.count();

    // Today's XP earned (replaces aggregate with raw SQL)
    const todayStartISO = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
    const todayXPRow = db.xPTransaction.queryOne(
      `SELECT SUM("amount") as total FROM "XPTransaction" WHERE "userId" = ? AND "createdAt" >= ? AND "amount" > 0`,
      userId, todayStartISO
    );
    const todayXP = todayXPRow?.total || 0;

    // Recent streak record
    const recentStreak = db.streakRecord.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      xp: userData.xp,
      level: userData.level,
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent,
      currentStreak: userData.currentStreak,
      longestStreak: userData.longestStreak,
      lastStudyDate: userData.lastStudyDate,
      totalStudyMinutes: userData.totalStudyMinutes,
      totalSessions: userData.totalSessions,
      totalTasksCompleted: userData.totalTasksCompleted,
      totalFlashcardsReviewed: userData.totalFlashcardsReviewed,
      totalQuestionsAnswered: userData.totalQuestionsAnswered,
      achievementsUnlocked: unlockedCount,
      totalAchievements,
      todayXP,
      recentStreak: recentStreak
        ? { date: recentStreak.date, streak: recentStreak.streak }
        : null,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
