import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/usage';
import { db, nowISO } from '@/lib/db';

/**
 * POST /api/payment/confirm
 * Confirms a payment and upgrades the user's plan.
 *
 * Body: { plan: 'SAMURAI'|'SENSEI', billing: 'monthly'|'annual', method: 'pix'|'card', lastFour?: string }
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado', success: false }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados inválidos', success: false }, { status: 400 });
    }

    const { plan: planTier, billing } = body;
    const validPlans = ['SAMURAI', 'SENSEI'];
    const validBilling = ['monthly', 'annual'];

    if (!validPlans.includes(planTier) || !validBilling.includes(billing)) {
      return NextResponse.json({ error: 'Plano ou ciclo inválido', success: false }, { status: 400 });
    }

    // Calculate period end based on billing cycle
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    // Add 7-day trial: period starts after trial
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Update user plan in database
    await db.user.update({
      where: { id: user.id },
      data: {
        plan: planTier,
        stripeCurrentPeriodEnd: periodEnd.toISOString(),
        updatedAt: nowISO(),
      },
    });

    console.log(`[payment/confirm] User ${user.id} upgraded to ${planTier} (${billing})`);

    return NextResponse.json({
      success: true,
      plan: planTier,
      billing,
      trialEndsAt: trialEnd.toISOString(),
      periodEndsAt: periodEnd.toISOString(),
    });
  } catch (error: any) {
    console.error('[payment/confirm] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Tente novamente.', success: false },
      { status: 500 }
    );
  }
}
