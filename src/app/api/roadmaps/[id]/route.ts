import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_STATUSES = ['active', 'completed', 'paused'];

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
    const existing = await db.roadmap.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Trilha nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, description, topic, status, steps, currentStep } = body;

    const data: any = {};
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof description === 'string') data.description = description.trim();
    if (typeof topic === 'string' && topic.trim()) data.topic = topic.trim();
    if (status && VALID_STATUSES.includes(status)) data.status = status;
    if (Array.isArray(steps)) {
      data.steps = JSON.stringify(steps);
      data.totalSteps = steps.length;
    }
    if (typeof currentStep === 'number' && currentStep >= 0) {
      data.currentStep = Math.min(currentStep, existing.totalSteps);
    }

    // Auto-complete if currentStep >= totalSteps
    const effectiveStep = typeof currentStep === 'number' ? Math.min(currentStep, existing.totalSteps) : existing.currentStep;
    if (effectiveStep >= existing.totalSteps) {
      data.status = 'completed';
    }

    const roadmap = await db.roadmap.update({
      where: { id },
      data,
    });

    return NextResponse.json({ roadmap });
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
    const existing = await db.roadmap.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Trilha nao encontrada' }, { status: 404 });
    }

    await db.roadmap.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
