import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const XP_PER_TASK = 30;

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
    const existing = await db.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, subjectId, priority, status, dueDate, estimatedMinutes, actualMinutes, sortOrder } = body;

    const data: any = {};
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (subjectId === null) data.subjectId = null;
    if (typeof subjectId === 'string' && subjectId) {
      const subject = await db.subject.findFirst({ where: { id: subjectId, userId } });
      if (subject) data.subjectId = subjectId;
    }
    if (priority && VALID_PRIORITIES.includes(priority)) data.priority = priority;
    if (status && VALID_STATUSES.includes(status)) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
    if (typeof estimatedMinutes === 'number') data.estimatedMinutes = estimatedMinutes;
    if (typeof actualMinutes === 'number') data.actualMinutes = actualMinutes;
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder;

    // Handle task completion: award XP
    let xpAwarded = false;
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      data.completedAt = new Date().toISOString();
      await awardXP(userId, XP_PER_TASK, 'TASK_COMPLETED', `Tarefa concluida: ${existing.title}`);
      xpAwarded = true;
      // Update user total tasks completed
      await db.user.update({
        where: { id: userId },
        data: { totalTasksCompleted: { increment: 1 } },
      });
    }

    // If un-completing a task
    if (status && status !== 'COMPLETED' && existing.status === 'COMPLETED') {
      data.completedAt = null;
    }

    const task = await db.task.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return NextResponse.json({ task, xpAwarded });
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
    const existing = await db.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 });
    }

    await db.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
