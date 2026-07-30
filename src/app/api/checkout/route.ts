import { NextResponse } from 'next/server';
import { getSessionUser, isPremiumUser } from '@/lib/usage';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    if (isPremiumUser(user)) {
      return NextResponse.json({ error: 'Voce ja e Premium' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!stripeSecretKey || !priceId) {
      return NextResponse.json({
        error: 'Pagamento nao disponivel no momento',
        code: 'STRIPE_NOT_CONFIGURED',
      }, { status: 503 });
    }

    // Dynamic import of Stripe (server-only)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const origin = request.headers.get('origin') || 'https://study-ai-nine-xi.vercel.app';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      metadata: { userId: user.id },
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Erro ao criar sessao de pagamento' }, { status: 500 });
  }
}
