import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO, sqlite } from '@/lib/db';

const VALID_SOURCES = [
  'STUDY_SESSION', 'TASK_COMPLETED', 'GOAL_COMPLETED', 'FLASHCARD_REVIEW',
  'QUIZ_COMPLETED', 'SIMULADO_COMPLETED', 'STREAK_BONUS', 'DAILY_LOGIN', 'MANUAL',
];

export async function GET(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const source = searchParams.get('source');

    // Fetch user for level info
    const userData = db.user.findUnique({
      where: { id: userId },
      select: ['xp', 'level'],
    });

    if (!userData) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const currentLevelXP = userData.level * 100;
    const nextLevelXP = (userData.level + 1) * 100;
    const xpInCurrentLevel = userData.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

    // XP history
    const where: any = { userId };
    if (source && VALID_SOURCES.includes(source)) {
      where.source = source;
    }

    const transactions = db.xPTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    // Total XP breakdown by source (replaces groupBy)
    const xpBreakdown = db.xPTransaction.query(
      `SELECT "source", SUM("amount") as total FROM "XPTransaction" WHERE "userId" = ? AND "amount" > 0 GROUP BY "source"`,
      userId
    );

    return NextResponse.json({
      xp: userData.xp,
      level: userData.level,
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent,
      transactions,
      xpBreakdown: xpBreakdown.map(b => ({
        source: b.source,
        total: b.total || 0,
      })),
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { amount, source, description } = body;

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'Quantidade de XP invalida' }, { status: 400 });
    }

    const finalSource = VALID_SOURCES.includes(source) ? source : 'MANUAL';

    const xpTx = db.xPTransaction.create({
      data: {
        id: genId(),
        userId,
        amount,
        source: finalSource,
        description: typeof description === 'string' ? description.trim() : null,
        createdAt: nowISO(),
      },
    });

    // Recalculate level
    const userData = db.user.findUnique({
      where: { id: userId },
      select: ['xp', 'level'],
    });
    if (!userData) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const newXP = userData.xp + amount;
    let newLevel = userData.level;
    const levelXP = newLevel * 100;

    if (amount > 0 && newXP >= levelXP) {
      newLevel = newLevel + 1;
    }

    db.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel, updatedAt: nowISO() },
    });

    return NextResponse.json({ transaction: xpTx, newXp: newXP, newLevel }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
