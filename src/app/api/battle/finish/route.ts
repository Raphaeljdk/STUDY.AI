import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { canAccess, FEATURE_MIN_PLAN } from '@/lib/plan-gating';
import { db, genId, nowISO, sqlite } from '@/lib/db';

async function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = await db.xpTransaction.create({
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

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'battle')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['battle'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { battleId, correctAnswers, confidenceAvg, timeUsed } = body;

    if (!battleId || typeof battleId !== 'string') {
      return NextResponse.json({ error: 'ID da batalha obrigatorio' }, { status: 400 });
    }

    const battle = await db.battle.findFirst({ where: { id: battleId, userId } });
    if (!battle) {
      return NextResponse.json({ error: 'Batalha nao encontrada' }, { status: 404 });
    }
    if (battle.completedAt) {
      return NextResponse.json({ error: 'Batalha ja finalizada' }, { status: 400 });
    }

    const correct = typeof correctAnswers === 'number' ? correctAnswers : 0;
    const confidence = typeof confidenceAvg === 'number' ? confidenceAvg : 0;
    const percentage = battle.totalQuestions > 0 ? Math.round((correct / battle.totalQuestions) * 100) : 0;

    // XP: 10 per correct answer + bonus for high accuracy
    let xpAmount = correct * 10;
    if (percentage >= 80) xpAmount += 25;
    else if (percentage >= 60) xpAmount += 10;
    if (percentage === 100) xpAmount += 20; // Perfect bonus

    const updatedBattle = await db.battle.update({
      where: { id: battleId },
      data: {
        correctAnswers: correct,
        confidenceAvg: confidence,
        xpEarned: xpAmount,
        completedAt: nowISO(),
      },
    });

    // Award XP
    const xpTx = await awardXP(userId, xpAmount, 'SIMULADO_COMPLETED', `Duelo: ${battle.subject} - ${percentage}%`);

    // Update user total questions answered (increment)
    await sqlite.execute({ sql: 'UPDATE "User" SET "totalQuestionsAnswered" = "totalQuestionsAnswered" + $1 WHERE "id" = $2', args: [battle.totalQuestions, userId] });

    const userData = await db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });

    return NextResponse.json({
      battle: updatedBattle,
      xpAwarded: xpAmount,
      newXp: userData?.xp,
      newLevel: userData?.level,
      percentage,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
