import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO, sqlite } from '@/lib/db';

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const XP_PER_TASK = 30;

async function awardXP(userId: string, amount: number, source: any, description: string) {
  const xpTx = await db.xPTransaction.create({
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

async function attachSubject(task: any) {
  if (!task?.subjectId) return { ...task, subject: null };
  const subject = await db.subject.findUnique({ where: { id: task.subjectId }, select: ['id', 'name', 'color', 'icon'] });
  return { ...task, subject: subject || null };
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

    const data: any = { updatedAt: nowISO() };
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
      // Update user total tasks completed (was increment)
      await sqlite.execute({ sql: 'UPDATE "User" SET "totalTasksCompleted" = "totalTasksCompleted" + 1 WHERE "id" = $1', args: [userId] });
    }

    // If un-completing a task
    if (status && status !== 'COMPLETED' && existing.status === 'COMPLETED') {
      data.completedAt = null;
    }

    const task = await db.task.update({
      where: { id },
      data,
    });

    const taskWithSubject = await attachSubject(task);

    return NextResponse.json({ task: taskWithSubject, xpAwarded });
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
