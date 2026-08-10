import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, genId, nowISO, sqlite } from '@/lib/db';

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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const { id } = await params;
    // Composite unique → use AND (was userId_discoverItemId)
    const save = db.discoverSave.findFirst({ where: { userId, discoverItemId: id } });

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
    const userExists = db.user.findUnique({ where: { id: userId }, select: ['id'] });
    if (!userExists) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }

    const { id } = await params;

    const item = db.discoverItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    // Check if already saved (composite unique → use AND)
    const existing = db.discoverSave.findFirst({ where: { userId, discoverItemId: id } });

    if (existing) {
      // Unsave
      db.discoverSave.delete({ where: { id: existing.id } });
      // Decrement saves (raw SQL)
      sqlite.prepare('UPDATE "DiscoverItem" SET "saves" = "saves" - 1 WHERE "id" = ?').run(id);
      return NextResponse.json({ isSaved: false });
    } else {
      // Save
      db.discoverSave.create({
        data: { id: genId(), userId, discoverItemId: id, createdAt: nowISO() },
      });
      // Increment saves (raw SQL)
      sqlite.prepare('UPDATE "DiscoverItem" SET "saves" = "saves" + 1 WHERE "id" = ?').run(id);
      return NextResponse.json({ isSaved: true });
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
