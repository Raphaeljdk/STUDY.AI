import { db } from '@/lib/db';
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
  const today = getTodayStart();
  const usage = await db.dailyUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  return {
    chatMessages: usage?.chatMessages ?? 0,
    flashcards: usage?.flashcards ?? 0,
  };
}

export async function canUse(userId: string, type: UsageType): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, role: true } });
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
  const today = getTodayStart();
  const field = type === 'chatMessages' ? 'chatMessages' : 'flashcards';

  await db.dailyUsage.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export function isPremiumUser(user: { plan?: string; role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.plan === 'PREMIUM';
}
