import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = await db.xPTransaction.create({
    data: { userId, amount, source, description },
  });

  const user = await db.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
  if (!user) return xpTx;

  const newXP = user.xp + amount;
  const newLevel = Math.floor(newXP / 500) + 1;

  await db.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  });

  return xpTx;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        completedAt: new Date(),
      },
    });

    // Award XP
    const xpTx = await awardXP(userId, xpAmount, 'GOAL_COMPLETED', `Missao concluida: ${mission.title}`);

    const user = await db.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });

    return NextResponse.json({
      mission: updatedMission,
      xpAwarded: xpAmount,
      newXp: user?.xp,
      newLevel: user?.level,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
