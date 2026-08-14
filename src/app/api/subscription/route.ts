import { NextResponse } from 'next/server';
import { getSessionUser, isPremiumUser } from '@/lib/usage';
import type { Plan } from '@/lib/plan-gating';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const plan = (user.role === 'ADMIN' ? 'SENSEI' : (user.plan || 'FREE')) as Plan;
    const premium = isPremiumUser(user);

    return NextResponse.json({
      plan,
      isPremium: premium,
      stripeSubscriptionId: user.stripeSubscriptionId || null,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd || null,
      hasActiveSubscription: !!user.stripeSubscriptionId,
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
  }
}
