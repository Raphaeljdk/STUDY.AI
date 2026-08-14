import { db, genId } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Plan } from './plan-gating';

export const FREE_LIMITS = {
  chatMessages: 20,
  flashcards: 10,
} as const;

export type UsageType = 'chatMessages' | 'flashcards';

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getUsage(userId: string) {
  const today = getTodayStart().toISOString();
  const usage = await db.dailyUsage.findFirst({
    where: { userId, date: today },
  });
  return {
    chatMessages: usage?.chatMessages ?? 0,
    flashcards: usage?.flashcards ?? 0,
  };
}

export async function canUse(userId: string, type: UsageType): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: ['plan', 'role'] });
  if (!user) return { allowed: false, used: 0, limit: 0 };

  // Admin and any paid plan bypass limits
  if (user.role === 'ADMIN' || user.plan === 'SAMURAI' || user.plan === 'SENSEI') {
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

  const existing = await db.dailyUsage.findFirst({ where: { userId, date: today } });
  if (existing) {
    await db.dailyUsage.exec(
      `UPDATE "DailyUsage" SET "${field}" = "${field}" + 1 WHERE "userId" = ? AND "date" = ?`,
      userId, today
    );
  } else {
    await db.dailyUsage.create({
      data: { id: genId(), userId, date: today, [field]: 1 },
    });
  }
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export function isPremiumUser(user: { plan?: string; role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.plan === 'SAMURAI' || user.plan === 'SENSEI';
}

export function getUserPlan(user: { plan?: string; role?: string } | null): Plan {
  if (!user) return 'FREE';
  if (user.role === 'ADMIN') return 'SENSEI'; // Admin gets full access
  return (user.plan as Plan) || 'FREE';
}
