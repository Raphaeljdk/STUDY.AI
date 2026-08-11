import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

const VALID_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'];
const XP_PER_GOAL = 50;

async function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = await db.xpTransaction.create({
    data: { id: genId(), userId, amount, source, description, createdAt: nowISO() },
  });

  const userData = await db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });
  if (!userData) return;

  const newXP = userData.xp + amount;
  let newLevel = userData.level;
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

async function attachSubject(goal: any) {
  if (!goal?.subjectId) return { ...goal, subject: null };
  const subject = await db.subject.findUnique({ where: { id: goal.subjectId }, select: ['id', 'name', 'color', 'icon'] });
  return { ...goal, subject: subject || null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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

    const data: any = { updatedAt: nowISO() };
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (typeof currentValue === 'number') data.currentValue = currentValue;
    if (typeof targetValue === 'number') data.targetValue = targetValue;
    if (typeof unit === 'string') data.unit = unit;
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate).toISOString() : null;
    if (status && VALID_STATUSES.includes(status)) data.status = status;

    // Auto-complete goal if currentValue >= targetValue
    let xpAwarded = false;
    const newCurrentValue = typeof currentValue === 'number' ? currentValue : existing.currentValue;
    const newTargetValue = typeof targetValue === 'number' ? targetValue : existing.targetValue;

    if (newTargetValue && newCurrentValue >= newTargetValue && existing.status !== 'COMPLETED') {
      data.status = 'COMPLETED';
      data.completedAt = new Date().toISOString();
      await awardXP(userId, XP_PER_GOAL, 'GOAL_COMPLETED', `Meta concluida: ${existing.title}`);
      xpAwarded = true;
    }

    // Explicit mark complete
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      data.completedAt = new Date().toISOString();
      if (!xpAwarded) {
        await awardXP(userId, XP_PER_GOAL, 'GOAL_COMPLETED', `Meta concluida: ${existing.title}`);
        xpAwarded = true;
      }
    }

    const goal = await db.goal.update({
      where: { id },
      data,
    });

    const goalWithSubject = await attachSubject(goal);

    return NextResponse.json({ goal: goalWithSubject, xpAwarded });
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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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
