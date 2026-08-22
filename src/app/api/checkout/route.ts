import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/usage';
import { db, nowISO } from '@/lib/db';

// ── Stripe Plan Config ──
type PlanTier = 'SAMURAI' | 'SENSEI';
type BillingCycle = 'monthly' | 'annual';

interface PlanConfig {
  name: string;
  monthly: number;   // cents
  annual: number;    // cents
  trialDays: number;
}

const PLANS: Record<PlanTier, PlanConfig> = {
  SAMURAI: {
    name: 'Samurai — Pro',
    monthly: 1990,   // R$ 19,90
    annual: 19900,   // R$ 199,00
    trialDays: 7,
  },
  SENSEI: {
    name: 'Sensei — Premium',
    monthly: 3490,   // R$ 34,90
    annual: 34900,   // R$ 349,00
    trialDays: 7,
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }
    const planTier = (body.plan || 'SAMURAI') as PlanTier;
    const billingCycle = (body.billing || 'monthly') as BillingCycle;

    if (!PLANS[planTier]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const planConfig = PLANS[planTier];
    const amount = billingCycle === 'monthly' ? planConfig.monthly : planConfig.annual;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({
        error: 'Pagamento indisponível no momento',
        code: 'STRIPE_NOT_CONFIGURED',
      }, { status: 503 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId, updatedAt: nowISO() },
      });
    }

    // If user has an existing subscription, cancel it to prevent double-billing
    if (user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        console.log(`[checkout] Cancelled previous subscription ${user.stripeSubscriptionId} for user ${user.id}`);
      } catch (cancelErr: any) {
        // Subscription may already be cancelled — log but continue
        console.warn(`[checkout] Could not cancel previous subscription: ${cancelErr.message}`);
      }
      // Clear old subscription reference so the webhook sets the new one cleanly
      await db.user.update({
        where: { id: user.id },
        data: { stripeSubscriptionId: '', updatedAt: nowISO() },
      });
    }

    const origin = request.headers.get('origin') || 'https://study-ai-nine-xi.vercel.app';

    // Build recurring interval
    const recurringInterval = billingCycle === 'monthly' ? 'month' : 'year';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: amount,
            recurring: { interval: recurringInterval },
            product_data: {
              name: planConfig.name,
              description: billingCycle === 'monthly'
                ? `Plano ${planTier === 'SAMURAI' ? 'Samurai Pro' : 'Sensei Premium'} — Mensal`
                : `Plano ${planTier === 'SAMURAI' ? 'Samurai Pro' : 'Sensei Premium'} — Anual`,
              metadata: { planTier, billingCycle },
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?upgrade=success&plan=${planTier.toLowerCase()}`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      metadata: { userId: user.id, planTier, billingCycle },
      subscription_data: {
        trial_period_days: planConfig.trialDays,
        metadata: { userId: user.id, planTier, billingCycle },
      },
      allow_promotion_codes: true,
      // Brazilian locale for Stripe Checkout
      locale: 'pt-BR',
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento' },
      { status: 500 }
    );
  }
}
