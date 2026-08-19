import { NextResponse } from 'next/server';
import { getSessionUser, isPremiumUser } from '@/lib/usage';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isPremiumUser(user)) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    const origin = process.env.NEXTAUTH_URL || req.headers.get('origin') || 'https://study-ai-nine-xi.vercel.app';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/?upgrade=manage`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Erro ao abrir portal de assinatura' }, { status: 500 });
  }
}
