import { NextResponse } from 'next/server';
import { requireUserAsync } from '@/lib/api-server';
import { db, nowISO } from '@/lib/db';

export async function POST() {
  try {
    const user = await requireUserAsync();
    if (user instanceof NextResponse) return user;

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa para cancelar' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe nao configurado' }, { status: 503 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    // Cancel the subscription at period end
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    console.log(`[stripe/cancel] Subscription ${user.stripeSubscriptionId} marked for cancellation at period end for user ${user.id}`);

    return NextResponse.json({ success: true, message: 'Assinatura sera cancelada ao final do periodo atual' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
  }
}
