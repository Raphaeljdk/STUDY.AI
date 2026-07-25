import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const notebooks = await db.notebook.findMany({
      where: { userId },
      include: { _count: { select: { flashcards: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ notebooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { title, color } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 });
    }

    const notebook = await db.notebook.create({
      data: { title: title.trim(), color: color || '#c0392b', userId },
    });

    return NextResponse.json({ notebook }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
