import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'];
const XP_PER_GOAL = 50;

async function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = await db.xPTransaction.create({
    data: { userId, amount, source, description },
  });

  const user = await db.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
  if (!user) return;

  const newXP = user.xp + amount;
  let newLevel = user.level;
  const levelXP = newLevel * 100;

  if (newXP >= levelXP) {
    newLevel = newLevel + 1;
  }

  await db.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  });

  return xpTx;
}

export async function PATCH(
  request: Request,
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
    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, currentValue, targetValue, unit, targetDate, status } = body;

    const data: any = {};
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (typeof currentValue === 'number') data.currentValue = currentValue;
    if (typeof targetValue === 'number') data.targetValue = targetValue;
    if (typeof unit === 'string') data.unit = unit;
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
    if (status && VALID_STATUSES.includes(status)) data.status = status;

    // Auto-complete goal if currentValue >= targetValue
    let xpAwarded = false;
    const newCurrentValue = typeof currentValue === 'number' ? currentValue : existing.currentValue;
    const newTargetValue = typeof targetValue === 'number' ? targetValue : existing.targetValue;

    if (newTargetValue && newCurrentValue >= newTargetValue && existing.status !== 'COMPLETED') {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
      await awardXP(userId, XP_PER_GOAL, 'GOAL_COMPLETED', `Meta concluida: ${existing.title}`);
      xpAwarded = true;
    }

    // Explicit mark complete
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      data.completedAt = new Date();
      if (!xpAwarded) {
        await awardXP(userId, XP_PER_GOAL, 'GOAL_COMPLETED', `Meta concluida: ${existing.title}`);
        xpAwarded = true;
      }
    }

    const goal = await db.goal.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return NextResponse.json({ goal, xpAwarded });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 });
    }

    await db.goal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
