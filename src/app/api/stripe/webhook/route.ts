import { NextRequest, NextResponse } from 'next/server';
import { db, nowISO } from '@/lib/db';

// Disable body parsing — Stripe needs the raw body to verify the signature
export const runtime = 'nodejs';

/** Map Stripe subscription metadata.planTier → DB plan */
function tierToPlan(tier?: string | null): string {
  if (tier === 'SENSEI') return 'SENSEI';
  return 'SAMURAI';
}

async function handleEvent(event: any) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const planTier = session.metadata?.planTier;
      const billingCycle = session.metadata?.billingCycle;

      if (!userId) {
        console.warn('[webhook] No userId in checkout session metadata');
        return;
      }

      // Update user with Stripe subscription info
      // During trial, the subscription is active but first invoice hasn't been paid
      // We set the plan immediately so the user gets access during trial
      await db.user.update({
        where: { id: userId },
        data: {
          plan: tierToPlan(planTier),
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripePriceId: session.subscription ? undefined : undefined,
          stripeCurrentPeriodEnd: '',
          updatedAt: nowISO(),
        },
      });

      console.log(`[webhook] Checkout completed: user=${userId}, plan=${planTier}, billing=${billingCycle}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;

      if (!userId) {
        // Try to find user by stripeCustomerId
        const customer = sub.customer;
        if (customer) {
          const users = await db.user.findMany({ where: { stripeCustomerId: customer } });
          if (users.length > 0) {
            const user = users[0];
            await updateUserFromSubscription(user.id, sub);
            return;
          }
        }
        console.warn('[webhook] No userId in subscription metadata and no customer match');
        return;
      }

      await updateUserFromSubscription(userId, sub);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;

      if (!userId) {
        const customer = sub.customer;
        if (customer) {
          const users = await db.user.findMany({ where: { stripeCustomerId: customer } });
          if (users.length > 0) {
            const user = users[0];
            await downgradeUser(user.id);
            return;
          }
        }
        console.warn('[webhook] No userId in deleted subscription metadata');
        return;
      }

      await downgradeUser(userId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        console.warn(`[webhook] Payment failed for subscription ${subId}`);
        // Stripe will automatically retry. We don't downgrade immediately.
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }
}

async function updateUserFromSubscription(userId: string, sub: any) {
  const planTier = sub.metadata?.planTier;
  const status = sub.status; // 'active', 'trialing', 'past_due', 'canceled', 'unpaid'

  if (status === 'active' || status === 'trialing') {
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : '';

    await db.user.update({
      where: { id: userId },
      data: {
        plan: tierToPlan(planTier),
        stripeSubscriptionId: sub.id,
        stripeCurrentPeriodEnd: periodEnd,
        updatedAt: nowISO(),
      },
    });
    console.log(`[webhook] Subscription updated: user=${userId}, plan=${planTier}, status=${status}`);
  } else if (status === 'canceled' || status === 'unpaid') {
    await downgradeUser(userId);
  }
}

async function downgradeUser(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      plan: 'FREE',
      stripeSubscriptionId: '',
      stripePriceId: '',
      stripeCurrentPeriodEnd: '',
      updatedAt: nowISO(),
    },
  });
  console.log(`[webhook] User downgraded to FREE: user=${userId}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      console.error('[webhook] STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    let event: any;

    if (webhookSecret && webhookSecret !== 'whsec_placeholder_will_update_later' && sig) {
      // Verify webhook signature in production
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // In dev/test without webhook secret, parse directly
      event = JSON.parse(body);
    }

    await handleEvent(event);

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[webhook] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
