import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }

    const { id } = await params;

    const notebook = db.notebook.findFirst({
      where: { id, userId },
      select: ['id'],
    });

    if (!notebook) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    const pages = db.notebookPage.findMany({
      where: { notebookId: id },
      orderBy: { pageNumber: 'asc' },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }

    const { id } = await params;

    const notebook = db.notebook.findFirst({
      where: { id, userId },
      select: ['id'],
    });

    if (!notebook) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    let body: { paperStyle?: string; paperColor?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const lastPage = db.notebookPage.findFirst({
      where: { notebookId: id },
      orderBy: { pageNumber: 'desc' },
      select: ['pageNumber'],
    });

    const nextPageNumber = (lastPage?.pageNumber ?? 0) + 1;

    const page = db.notebookPage.create({
      data: {
        id: genId(),
        notebookId: id,
        pageNumber: nextPageNumber,
        paperStyle: body.paperStyle ?? 'blank',
        paperColor: body.paperColor ?? '#ffffff',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
