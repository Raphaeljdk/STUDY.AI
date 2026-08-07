import { NextResponse } from 'next/server';
import { getSessionUser, getUsage, isPremiumUser, FREE_LIMITS } from '@/lib/usage';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const premium = isPremiumUser(user);
    const usage = await getUsage(user.id);

    return NextResponse.json({
      plan: user.plan,
      isPremium: premium,
      limits: premium ? { chatMessages: Infinity, flashcards: Infinity } : FREE_LIMITS,
      usage,
      remaining: premium
        ? { chatMessages: Infinity, flashcards: Infinity }
        : {
            chatMessages: Math.max(0, FREE_LIMITS.chatMessages - usage.chatMessages),
            flashcards: Math.max(0, FREE_LIMITS.flashcards - usage.flashcards),
          },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
