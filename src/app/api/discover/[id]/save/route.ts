import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { canAccess, FEATURE_MIN_PLAN } from '@/lib/plan-gating';
import { db, genId, nowISO, sqlite } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'discover')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['discover'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    const { id } = await params;
    // Composite unique → use AND (was userId_discoverItemId)
    const save = await db.discoverSave.findFirst({ where: { userId, discoverItemId: id } });

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
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'discover')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['discover'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    const { id } = await params;

    const item = await db.discoverItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    // Check if already saved (composite unique → use AND)
    const existing = await db.discoverSave.findFirst({ where: { userId, discoverItemId: id } });

    if (existing) {
      // Unsave
      await db.discoverSave.delete({ where: { id: existing.id } });
      // Decrement saves (raw SQL)
      await sqlite.execute({ sql: 'UPDATE "DiscoverItem" SET "saves" = "saves" - 1 WHERE "id" = $1', args: [id] });
      return NextResponse.json({ isSaved: false });
    } else {
      // Save
      await db.discoverSave.create({
        data: { id: genId(), userId, discoverItemId: id, createdAt: nowISO() },
      });
      // Increment saves (raw SQL)
      await sqlite.execute({ sql: 'UPDATE "DiscoverItem" SET "saves" = "saves" + 1 WHERE "id" = $1', args: [id] });
      return NextResponse.json({ isSaved: true });
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
