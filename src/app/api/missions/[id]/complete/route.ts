import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

async function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = await db.xPTransaction.create({
    data: { id: genId(), userId, amount, source, description, createdAt: nowISO() },
  });

  const userData = await db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });
  if (!userData) return xpTx;

  const newXP = userData.xp + amount;
  const newLevel = Math.floor(newXP / 500) + 1;

  await db.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel, updatedAt: nowISO() },
  });

  return xpTx;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const mission = await db.mission.findFirst({ where: { id, userId } });
    if (!mission) {
      return NextResponse.json({ error: 'Missao nao encontrada' }, { status: 404 });
    }
    if (mission.status === 'completed') {
      return NextResponse.json({ error: 'Missao ja concluida' }, { status: 400 });
    }

    const xpAmount = mission.xpReward || 100;

    const updatedMission = await db.mission.update({
      where: { id },
      data: {
        status: 'completed',
        completedSteps: mission.totalSteps,
        completedAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    // Award XP
    const xpTx = await awardXP(userId, xpAmount, 'GOAL_COMPLETED', `Missao concluida: ${mission.title}`);

    const userData = await db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });

    return NextResponse.json({
      mission: updatedMission,
      xpAwarded: xpAmount,
      newXp: userData?.xp,
      newLevel: userData?.level,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
