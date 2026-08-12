'use client';

import { useSession } from 'next-auth/react';
import { canAccess, PLAN_LIMITS, getRequiredPlan, type Plan, type PlanFeature } from '@/lib/plan-gating';
import { useMemo } from 'react';

export function usePlanGate(feature: string) {
  const { data: session } = useSession();
  const plan = ((session?.user as any)?.plan || 'FREE') as Plan;
  const accessible = canAccess(plan, feature);
  const limits = PLAN_LIMITS[plan];
  const requiredPlan = getRequiredPlan(feature);

  return {
    accessible,
    plan,
    limits,
    requiredPlan,
    user: session?.user,
  };
}

/** Batch check multiple features at once */
export function usePlanFeatures(features: string[]) {
  const { data: session } = useSession();
  const plan = ((session?.user as any)?.plan || 'FREE') as Plan;
  const featuresKey = features.join(',');

  return useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const f of features) {
      result[f] = canAccess(plan, f);
    }
    return result;
  }, [plan, featuresKey, features]);
}
