import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;

    const notebook = await db.notebook.findFirst({
      where: { id, userId },
      select: ['id'],
    });

    if (!notebook) {
      return NextResponse.json({ error: 'Caderno nao encontrado' }, { status: 404 });
    }

    const pages = await db.notebookPage.findMany({
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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;

    const notebook = await db.notebook.findFirst({
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

    const lastPage = await db.notebookPage.findFirst({
      where: { notebookId: id },
      orderBy: { pageNumber: 'desc' },
      select: ['pageNumber'],
    });

    const nextPageNumber = (lastPage?.pageNumber ?? 0) + 1;

    const page = await db.notebookPage.create({
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
