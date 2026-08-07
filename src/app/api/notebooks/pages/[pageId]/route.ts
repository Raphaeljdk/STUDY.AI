import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }

    const { pageId } = await params;

    const page = await db.notebookPage.findFirst({
      where: { id: pageId },
      include: {
        notebook: {
          select: { userId: true },
        },
      },
    });

    if (!page || page.notebook.userId !== userId) {
      return NextResponse.json({ error: 'Pagina nao encontrada' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }

    const { pageId } = await params;

    const existingPage = await db.notebookPage.findFirst({
      where: { id: pageId },
      include: {
        notebook: {
          select: { userId: true },
        },
      },
    });

    if (!existingPage || existingPage.notebook.userId !== userId) {
      return NextResponse.json({ error: 'Pagina nao encontrada' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { canvasData, textContent, paperStyle, paperColor, lineColor } = body;

    const data: any = {};
    if (typeof canvasData === 'string') data.canvasData = canvasData;
    if (typeof textContent === 'string') data.textContent = textContent;
    if (typeof paperStyle === 'string') data.paperStyle = paperStyle;
    if (typeof paperColor === 'string') data.paperColor = paperColor;
    if (typeof lineColor === 'string') data.lineColor = lineColor;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 });
    }

    const page = await db.notebookPage.update({
      where: { id: pageId },
      data,
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 });
    }

    const { pageId } = await params;

    const existingPage = await db.notebookPage.findFirst({
      where: { id: pageId },
      include: {
        notebook: {
          select: { userId: true },
        },
      },
    });

    if (!existingPage || existingPage.notebook.userId !== userId) {
      return NextResponse.json({ error: 'Pagina nao encontrada' }, { status: 404 });
    }

    await db.notebookPage.delete({
      where: { id: pageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
