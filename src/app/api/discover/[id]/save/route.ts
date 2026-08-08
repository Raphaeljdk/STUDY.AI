import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
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
    const save = await db.discoverSave.findUnique({
      where: { userId_discoverItemId: { userId, discoverItemId: id } },
    });

    return NextResponse.json({ isSaved: !!save });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
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

    const item = await db.discoverItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    // Check if already saved
    const existing = await db.discoverSave.findUnique({
      where: { userId_discoverItemId: { userId, discoverItemId: id } },
    });

    if (existing) {
      // Unsave
      await db.discoverSave.delete({ where: { id: existing.id } });
      await db.discoverItem.update({
        where: { id },
        data: { saves: { decrement: 1 } },
      });
      return NextResponse.json({ isSaved: false });
    } else {
      // Save
      await db.discoverSave.create({
        data: { userId, discoverItemId: id },
      });
      await db.discoverItem.update({
        where: { id },
        data: { saves: { increment: 1 } },
      });
      return NextResponse.json({ isSaved: true });
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
