import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, genId, nowISO, sqlite } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

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
