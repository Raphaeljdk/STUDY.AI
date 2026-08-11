import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    // Replace Prisma include with separate queries
    const achievements = await db.achievement.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Get user's unlocked achievements for this user
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: ['achievementId', 'unlockedAt'],
    });
    const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

    const achievementsWithStatus = achievements.map(a => ({
      id: a.id,
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      xpReward: a.xpReward,
      category: a.category,
      sortOrder: a.sortOrder,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.has(a.id) ? unlockedMap.get(a.id)!.unlockedAt : null,
    }));

    const unlockedCount = achievementsWithStatus.filter(a => a.unlocked).length;

    return NextResponse.json({
      achievements: achievementsWithStatus,
      total: achievementsWithStatus.length,
      unlockedCount,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
