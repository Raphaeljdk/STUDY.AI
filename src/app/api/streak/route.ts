import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

/**
 * GET /api/streak
 * Returns the user's current streak, longest streak, and lastStudyDate.
 */
export async function GET() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    const userData = await db.user.findUnique({
      where: { id: userId },
      select: ['currentStreak', 'longestStreak', 'lastStudyDate'],
    });

    if (!userData) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      currentStreak: userData.currentStreak ?? 0,
      longestStreak: userData.longestStreak ?? 0,
      lastStudyDate: userData.lastStudyDate ?? null,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/streak
 * Called when the user opens the app. Updates the streak:
 * - If today's date is the same as lastStudyDate, do nothing
 * - If yesterday was the lastStudyDate, increment currentStreak
 * - If more than 1 day gap, reset to 1
 * - Update longestStreak if needed
 */
export async function POST() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;
    const userId = user.id;

    // Get current user data
    const userData = await db.user.findUnique({
      where: { id: userId },
      select: ['currentStreak', 'longestStreak', 'lastStudyDate'],
    });

    if (!userData) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = formatDateStr(today);
    const lastStudy = userData.lastStudyDate;

    // If already active today, just return current data
    if (lastStudy === todayStr) {
      return NextResponse.json({
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        lastStudyDate: lastStudy,
        updated: false,
      });
    }

    let newStreak: number;

    if (!lastStudy) {
      // First time ever
      newStreak = 1;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateStr(yesterday);

      if (lastStudy === yesterdayStr) {
        // Consecutive day — increment
        newStreak = (userData.currentStreak ?? 0) + 1;
      } else {
        // Streak broken — reset to 1
        newStreak = 1;
      }
    }

    const newLongest = Math.max(newStreak, userData.longestStreak ?? 0);

    await db.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStudyDate: todayStr,
        updatedAt: nowISO(),
      },
    });

    return NextResponse.json({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStudyDate: todayStr,
      updated: true,
      wasIncremented: newStreak > (userData.currentStreak ?? 0),
      wasReset: newStreak === 1 && (userData.currentStreak ?? 0) > 1,
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Returns a date string in YYYY-MM-DD format for the local timezone.
 */
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
