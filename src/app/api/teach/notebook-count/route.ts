import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { canAccess, FEATURE_MIN_PLAN } from '@/lib/plan-gating';
import { db } from '@/lib/db';

// GET /api/teach/notebook-count - count notebook pages for a subject/topic
export async function GET(request: Request) {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userPlan = (user.plan || 'FREE') as any;
    if (!canAccess(userPlan, 'teach')) {
      return NextResponse.json({ error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN['teach'], message: 'Esta funcionalidade requer o plano Samurai ou superior.' }, { status: 403 });
    }
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || '';
    const topic = searchParams.get('topic') || '';

    if (!subject && !topic) {
      return NextResponse.json({ count: 0, notebookNames: [] });
    }

    let relevantNotebookIds: string[] = [];
    const notebookNames: string[] = [];

    // Find notebooks via tags matching the subject
    if (subject) {
      const matchingTags = await db.notebookTag.findMany({
        where: { userId, name: { contains: subject } },
        select: ['notebookId'],
      });
      relevantNotebookIds = matchingTags.map((t: any) => t.notebookId);
    }

    // Find notebooks by title matching subject or topic
    const allUserNotebooks = await db.notebook.findMany({
      where: { userId },
      select: ['id', 'title'],
    });

    const titleMatched = allUserNotebooks.filter((nb: any) => {
      const titleLower = (nb.title || '').toLowerCase();
      return (
        (subject && titleLower.includes(subject.toLowerCase())) ||
        (topic && titleLower.includes(topic.toLowerCase()))
      ) && !relevantNotebookIds.includes(nb.id);
    });

    const allRelevant = [
      ...allUserNotebooks.filter((nb: any) => relevantNotebookIds.includes(nb.id)),
      ...titleMatched,
    ];

    // Count text content pages across relevant notebooks
    let totalPages = 0;
    for (const nb of allRelevant) {
      const count = await db.notebookPage.count({
        where: {
          notebookId: nb.id,
          textContent: { not: '' },
        },
      });
      if (count > 0) {
        totalPages += count;
        notebookNames.push(nb.title);
      }
    }

    return NextResponse.json({ count: totalPages, notebookNames });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ count: 0, notebookNames: [] });
  }
}
