import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, sqlite } from '@/lib/db';

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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const user = db.user.findUnique({
      where: { id: userId },
      select: [
        'xp', 'level', 'currentStreak', 'longestStreak', 'lastStudyDate',
        'totalStudyMinutes', 'totalSessions', 'totalTasksCompleted',
        'totalFlashcardsReviewed', 'totalQuestionsAnswered',
      ],
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Level progress
    const currentLevelXP = user.level * 100;
    const nextLevelXP = (user.level + 1) * 100;
    const xpInCurrentLevel = user.xp - currentLevelXP;
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
      xp: user.xp,
      level: user.level,
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastStudyDate: user.lastStudyDate,
      totalStudyMinutes: user.totalStudyMinutes,
      totalSessions: user.totalSessions,
      totalTasksCompleted: user.totalTasksCompleted,
      totalFlashcardsReviewed: user.totalFlashcardsReviewed,
      totalQuestionsAnswered: user.totalQuestionsAnswered,
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
