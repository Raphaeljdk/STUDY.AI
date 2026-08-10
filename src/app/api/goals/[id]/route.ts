import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

const VALID_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'];
const XP_PER_GOAL = 50;

function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = db.xPTransaction.create({
    data: { id: genId(), userId, amount, source, description, createdAt: nowISO() },
  });

  const user = db.user.findUnique({ where: { id: userId }, select: ['xp', 'level'] });
  if (!user) return;

  const newXP = user.xp + amount;
  let newLevel = user.level;
  const levelXP = newLevel * 100;

  if (newXP >= levelXP) {
    newLevel = newLevel + 1;
  }

  db.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  });

  return xpTx;
}

function attachSubject(goal: any) {
  if (!goal?.subjectId) return { ...goal, subject: null };
  const subject = db.subject.findUnique({ where: { id: goal.subjectId }, select: ['id', 'name', 'color', 'icon'] });
  return { ...goal, subject: subject || null };
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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const { id } = await params;
    const existing = db.goal.findFirst({ where: { id, userId } });
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
      awardXP(userId, XP_PER_GOAL, 'GOAL_COMPLETED', `Meta concluida: ${existing.title}`);
      xpAwarded = true;
    }

    // Explicit mark complete
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      data.completedAt = new Date().toISOString();
      if (!xpAwarded) {
        awardXP(userId, XP_PER_GOAL, 'GOAL_COMPLETED', `Meta concluida: ${existing.title}`);
        xpAwarded = true;
      }
    }

    const goal = db.goal.update({
      where: { id },
      data,
    });

    const goalWithSubject = attachSubject(goal);

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

    const { id } = await params;
    const existing = db.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Meta nao encontrada' }, { status: 404 });
    }

    db.goal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
