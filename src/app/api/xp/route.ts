import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_SOURCES = [
  'STUDY_SESSION', 'TASK_COMPLETED', 'GOAL_COMPLETED', 'FLASHCARD_REVIEW',
  'QUIZ_COMPLETED', 'SIMULADO_COMPLETED', 'STREAK_BONUS', 'DAILY_LOGIN', 'MANUAL',
];

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
 const limit = parseInt(searchParams.get('limit') || '50', 10);
    const source = searchParams.get('source');

    // Fetch user for level info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const currentLevelXP = user.level * 100;
    const nextLevelXP = (user.level + 1) * 100;
    const xpInCurrentLevel = user.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

    // XP history
    const where: any = { userId };
    if (source && VALID_SOURCES.includes(source)) {
      where.source = source;
    }

    const transactions = await db.xPTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    // Total XP breakdown by source
    const xpBreakdown = await db.xPTransaction.groupBy({
      by: ['source'],
      where: { userId, amount: { gt: 0 } },
      _sum: { amount: true },
    });

    return NextResponse.json({
      xp: user.xp,
      level: user.level,
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent,
      transactions,
      xpBreakdown: xpBreakdown.map(b => ({
        source: b.source,
        total: b._sum.amount || 0,
      })),
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const xpTx = await db.xPTransaction.create({
      data: {
        userId,
        amount,
        source: finalSource,
        description: typeof description === 'string' ? description.trim() : null,
      },
    });

    // Recalculate level
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const newXP = user.xp + amount;
    let newLevel = user.level;
    const levelXP = newLevel * 100;

    if (amount > 0 && newXP >= levelXP) {
      newLevel = newLevel + 1;
    }

    await db.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });

    return NextResponse.json({ transaction: xpTx, newXp: newXP, newLevel }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
