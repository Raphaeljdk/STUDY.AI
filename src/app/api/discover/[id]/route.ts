import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

export async function GET(
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

    // Get save count separately (was include._count)
    const saveCount = db.discoverSave.count({ where: { discoverItemId: id } });

    // Get user info separately (was include.user)
    const author = item.userId ? db.user.findUnique({ where: { id: item.userId }, select: ['id', 'name'] }) : null;

    // Check if user saved this item (composite unique → use AND)
    const save = db.discoverSave.findFirst({ where: { userId, discoverItemId: id } });

    return NextResponse.json({ item: { ...item, _count: { discoverSaves: saveCount }, user: author, isSaved: !!save } });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const { id } = await params;
    const existing = db.discoverItem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const { title, content, summary, subject, difficulty, duration, emoji, tags, isPublic } = body;

    const data: any = { updatedAt: nowISO() };
    if (typeof title === 'string' && title.trim()) data.title = title.trim();
    if (typeof content === 'string' && content.trim()) data.content = content.trim();
    if (typeof summary === 'string') data.summary = summary.trim();
    if (typeof subject === 'string') data.subject = subject.trim();
    if (['facil', 'medio', 'dificil'].includes(difficulty)) data.difficulty = difficulty;
    if (typeof duration === 'number') data.duration = duration;
    if (typeof emoji === 'string') data.emoji = emoji;
    if (typeof tags === 'string') data.tags = tags;
    if (typeof isPublic === 'boolean') data.isPublic = isPublic ? 1 : 0;

    const item = db.discoverItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({ item });
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
    const userId = user.id;

    const { id } = await params;
    const existing = db.discoverItem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    db.discoverItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
