import { NextResponse } from 'next/server';
import { db, nowISO } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia',
    });

    const signature = (await headers()).get('stripe-signature');
    if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const userId = event.data?.object?.metadata?.userId;
    if (!userId) return NextResponse.json({ received: true });

    switch (event.type) {
      case 'checkout.session.completed': {
        await db.user.update({
          where: { id: userId },
          data: {
            plan: 'PREMIUM',
            stripeSubscriptionId: event.data.object.subscription,
            stripePriceId: event.data.object.line_items?.data?.[0]?.price?.id,
            stripeCurrentPeriodEnd: new Date(event.data.object.subscription_details?.current_period_end * 1000 || Date.now() + 30 * 86400000).toISOString(),
            updatedAt: nowISO(),
          },
        });
        break;
      }
      case 'customer.subscription.updated': {
        if (event.data.object.status === 'active') {
          await db.user.update({
            where: { id: userId },
            data: { plan: 'PREMIUM', stripeCurrentPeriodEnd: new Date(event.data.object.current_period_end * 1000).toISOString(), updatedAt: nowISO() },
          });
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        await db.user.update({
          where: { id: userId },
          data: { plan: 'FREE', stripeCurrentPeriodEnd: null, updatedAt: nowISO() },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
