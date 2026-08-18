import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUserPlan } from './usage';
import { type Plan, canAccess, FEATURE_MIN_PLAN } from './plan-gating';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

/**
 * Validates the current session and returns the authenticated user.
 * Returns null if not authenticated (caller should return the NextResponse).
 *
 * Usage:
 *   const user = requireUser(request);
 *   if (!user) return user.errorResponse;
 */
export function requireUser(request?: Request): { user: SessionUser } | { errorResponse: NextResponse } {
  // NOTE: getServerSession is async, but we call it synchronously here.
  // This is a synchronous helper wrapper — the caller must `await` getServerSession
  // separately, or use requireUserAsync below.
  // Actually, let's just make this async-friendly by returning a promise-like pattern.
  // For simplicity, we export both sync and async versions.
  throw new Error('Use requireUserAsync() instead — it is async to support getServerSession');
}

/**
 * Async version of requireUser. Call it with `await` in API routes.
 *
 * Usage:
 *   const result = await requireUserAsync();
 *   if (!result) return result;  // NextResponse with 401 already sent
 *   // result.user.id, result.user.email, etc.
 */
export async function requireUserAsync(): Promise<NextResponse | SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autorizado', code: 'NOT_AUTHENTICATED' }, { status: 401 });
  }

  const userId = (session.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Sessao invalida', code: 'INVALID_SESSION' }, { status: 401 });
  }

  const userExists = await db.user.findUnique({ where: { id: userId }, select: ['id', 'email', 'name', 'role', 'plan'] });
  if (!userExists) {
    return NextResponse.json({ error: 'Sessao expirada. Faca login novamente.', code: 'USER_NOT_FOUND' }, { status: 401 });
  }

  return userExists as SessionUser;
}

/**
 * Shorthand type guard for requireUserAsync result.
 * Returns true if the result is a NextResponse (error), false if it's a user object.
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Check if a user can access a premium feature.
 * Respects ADMIN role (admins get SENSEI access).
 * Returns a 403 NextResponse if access is denied, or null if allowed.
 *
 * Usage:
 *   const user = await requireUserAsync();
 *   if (user instanceof NextResponse) return user;
 *   const denied = requirePlan(user, 'battle');
 *   if (denied) return denied;
 */
export function requirePlan(user: SessionUser, feature: string): NextResponse | null {
  const plan = getUserPlan(user);
  if (!canAccess(plan, feature)) {
    return NextResponse.json(
      { error: 'PLAN_REQUIRED', requiredPlan: FEATURE_MIN_PLAN[feature], message: `Esta funcionalidade requer o plano ${FEATURE_MIN_PLAN[feature] === 'SENSEI' ? 'Sensei' : 'Samurai'} ou superior.` },
      { status: 403 },
    );
  }
  return null;
}
