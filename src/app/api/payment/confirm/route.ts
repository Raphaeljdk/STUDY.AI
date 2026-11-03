import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/usage';

/**
 * Legacy payment endpoint intentionally disabled.
 *
 * The previous implementation upgraded accounts solely on the basis of a
 * client request, without verifying a payment with a trusted provider.
 * Paid plans must be activated by a verified server-side payment webhook.
 */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: 'Assinaturas temporariamente indisponíveis. Nenhuma cobrança foi realizada.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[payment/confirm] Unavailable:', error);
    return NextResponse.json(
      { success: false, error: 'Serviço de assinaturas indisponível.' },
      { status: 503 }
    );
  }
}
