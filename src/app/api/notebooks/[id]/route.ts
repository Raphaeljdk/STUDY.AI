import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { id } = await params;

    const notebook = await db.notebook.findFirst({
      where: { id, userId },
      include: { flashcards: { orderBy: { createdAt: 'desc' } } },
    });

    if (!notebook) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ notebook });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { id } = await params;
    const body = await request.json();
    const { title, content, color } = body;

    const existing = await db.notebook.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    const data: any = {};
    if (typeof title === 'string') data.title = title.trim();
    if (typeof content === 'string') data.content = content;
    if (typeof color === 'string') data.color = color;

    const notebook = await db.notebook.update({ where: { id }, data });
    return NextResponse.json({ notebook });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { id } = await params;

    const existing = await db.notebook.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    await db.notebook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
