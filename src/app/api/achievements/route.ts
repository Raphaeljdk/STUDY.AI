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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    // Replace Prisma include with separate queries
    const achievements = db.achievement.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Get user's unlocked achievements for this user
    const userAchievements = db.userAchievement.findMany({
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
