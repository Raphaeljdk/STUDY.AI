import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function attachSubjects(tasks: any[]) {
  const subjectIds = [...new Set(tasks.map((t: any) => t.subjectId).filter(Boolean))];
  const subjects = subjectIds.length > 0
    ? db.subject.findMany({ where: { id: { in: subjectIds } }, select: ['id', 'name', 'color', 'icon'] })
    : [];
  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  return tasks.map((t: any) => ({ ...t, subject: t.subjectId ? subjectMap.get(t.subjectId) || null : null }));
}

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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const subjectId = searchParams.get('subjectId');

    const where: any = { userId };
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      where.priority = priority;
    }
    if (subjectId) {
      where.subjectId = subjectId;
    }

    const tasks = db.task.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const tasksWithSubjects = attachSubjects(tasks);

    return NextResponse.json({ tasks: tasksWithSubjects });
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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, subjectId, priority, dueDate, estimatedMinutes, sortOrder } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }

    // Validate subjectId if provided
    if (subjectId) {
      const subject = db.subject.findFirst({ where: { id: subjectId, userId } });
      if (!subject) {
        return NextResponse.json({ error: 'Disciplina nao encontrada' }, { status: 400 });
      }
    }

    const task = db.task.create({
      data: {
        id: genId(),
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        subjectId: subjectId || null,
        priority: VALID_PRIORITIES.includes(priority) ? priority : 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedMinutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        userId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    // Attach subject (was include)
    const tasksWithSubjects = attachSubjects([task]);

    return NextResponse.json({ task: tasksWithSubjects[0] }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
