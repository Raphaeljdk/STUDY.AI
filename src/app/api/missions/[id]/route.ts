import { NextResponse } from 'next/server';
import { requireUserAsync, requirePlan } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

const VALID_STATUSES = ['active', 'completed', 'abandoned'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const denied = requirePlan(user, 'missions');
    if (denied) return denied;
    const userId = user.id;

    const { id } = await params;
    const existing = await db.mission.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Missao nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, subject, status, steps, completedSteps } = body;

    const data: any = { updatedAt: nowISO() };
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (typeof subject === 'string') data.subject = subject.trim();
    if (status && VALID_STATUSES.includes(status)) data.status = status;
    if (Array.isArray(steps)) {
      data.steps = JSON.stringify(steps);
      data.totalSteps = steps.length;
    }
    if (typeof completedSteps === 'number' && completedSteps >= 0) {
      data.completedSteps = Math.min(completedSteps, existing.totalSteps);
    }

    const mission = await db.mission.update({
      where: { id },
      data,
    });

    return NextResponse.json({ mission });
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
    const denied = requirePlan(user, 'missions');
    if (denied) return denied;
    const userId = user.id;

    const { id } = await params;
    const existing = await db.mission.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Missao nao encontrada' }, { status: 404 });
    }

    await db.mission.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
