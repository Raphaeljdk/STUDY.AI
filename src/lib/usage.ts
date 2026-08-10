import { db, genId } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const FREE_LIMITS = {
  chatMessages: 5,
  flashcards: 3,
} as const;

export type UsageType = 'chatMessages' | 'flashcards';

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getUsage(userId: string) {
  const today = getTodayStart().toISOString();
  // findUnique with compound key → use findFirst (unique index on userId+date)
  const usage = db.dailyUsage.findFirst({
    where: { userId, date: today },
  });
  return {
    chatMessages: usage?.chatMessages ?? 0,
    flashcards: usage?.flashcards ?? 0,
  };
}

export async function canUse(userId: string, type: UsageType): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = db.user.findUnique({ where: { id: userId }, select: ['plan', 'role'] });
  if (!user) return { allowed: false, used: 0, limit: 0 };

  // Admin and premium bypass limits
  if (user.role === 'ADMIN' || user.plan === 'PREMIUM') {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const usage = await getUsage(userId);
  const used = usage[type];
  const limit = FREE_LIMITS[type];

  return { allowed: used < limit, used, limit };
}

export async function incrementUsage(userId: string, type: UsageType): Promise<void> {
  const today = getTodayStart().toISOString();
  const field = type === 'chatMessages' ? 'chatMessages' : 'flashcards';

  // Replace Prisma upsert with findFirst + create/update
  const existing = db.dailyUsage.findFirst({ where: { userId, date: today } });
  if (existing) {
    // Atomic increment via raw SQL
    db.dailyUsage.exec(
      `UPDATE "DailyUsage" SET "${field}" = "${field}" + 1 WHERE "userId" = ? AND "date" = ?`,
      userId, today
    );
  } else {
    db.dailyUsage.create({
      data: { id: genId(), userId, date: today, [field]: 1 },
    });
  }
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = db.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export function isPremiumUser(user: { plan?: string; role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.plan === 'PREMIUM';
}
