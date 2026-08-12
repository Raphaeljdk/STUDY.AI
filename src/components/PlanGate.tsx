'use client';

import { usePlanGate } from '@/hooks/use-plan-gate';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PLAN_LABELS, PLAN_PRICES } from '@/lib/plan-gating';

interface PlanGateProps {
  feature: string;
  children: React.ReactNode;
  requiredPlan?: 'SAMURAI' | 'SENSEI';
  message?: string;
  /** Called when user clicks upgrade. Defaults to scrolling to #pricing */
  onUpgrade?: () => void;
  /** Compact inline style for smaller containers */
  compact?: boolean;
}

export function PlanGate({ feature, children, requiredPlan, message, onUpgrade, compact = false }: PlanGateProps) {
  const { accessible, requiredPlan: autoRequiredPlan } = usePlanGate(feature);

  if (accessible) return <>{children}</>;

  const upgradePlan = requiredPlan || autoRequiredPlan || 'SAMURAI';
  const planLabel = PLAN_LABELS[upgradePlan];
  const planPrice = PLAN_PRICES[upgradePlan];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Scroll to pricing section
      const el = document.getElementById('pricing');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Try to open auth/upgrade modal
        (window as any).__studyai_openAuth?.('register');
      }
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-3 py-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ws-gold)_12%,transparent)]">
          <Lock size={20} className="text-[var(--ws-gold)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ws-text-primary)]">
            {message || `Recurso ${planLabel}`}
          </p>
          <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">
            Disponivel no plano {planLabel}
          </p>
        </div>
        <Button
          onClick={handleUpgrade}
          size="sm"
          className="gap-1.5 rounded-ws-button bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)] hover:bg-[var(--ws-accent-hover)]"
        >
          <Crown size={14} />
          Upgrade — {planPrice}/mês
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col items-center gap-4 rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-8 text-center backdrop-blur-xl"
    >
      {/* Decorative gradient */}
      <div
        className="pointer-events-none absolute inset-0 rounded-ws-organic"
        style={{
          background: `radial-gradient(ellipse at center, color-mix(in srgb, var(--ws-gold) 6%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ws-gold)_15%,transparent)]">
        <Lock size={28} className="text-[var(--ws-gold)]" />
      </div>

      <div className="relative">
        <h3 className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">
          Recurso {planLabel}
        </h3>
        <p className="mt-1.5 text-sm text-[var(--ws-text-tertiary)]">
          {message || `Este recurso esta disponivel no plano ${planLabel}. Desbloqueie todo o poder do StudyAI.`}
        </p>
      </div>

      <div className="relative flex items-baseline gap-1">
        <span className="font-serif-jp text-2xl font-bold text-[var(--ws-gold)]">{planPrice}</span>
        <span className="text-sm text-[var(--ws-text-tertiary)]">/mês</span>
      </div>

      <Button
        onClick={handleUpgrade}
        className="relative gap-2 rounded-ws-button bg-[var(--ws-accent)] px-6 py-3 text-sm font-medium text-[var(--ws-text-on-dark)] hover:bg-[var(--ws-accent-hover)]"
      >
        <Crown size={16} />
        Upgrade para {planLabel}
      </Button>
    </motion.div>
  );
}

/** Small inline lock badge for sidebar nav items */
export function LockBadge({ plan }: { plan: 'SAMURAI' | 'SENSEI' }) {
  return (
    <span
      className="ml-auto flex items-center gap-0.5 rounded-full bg-[color-mix(in_srgb,var(--ws-gold)_10%,transparent)] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[var(--ws-gold)]"
      title={`Disponivel no plano ${PLAN_LABELS[plan]}`}
    >
      <Lock size={8} />
    </span>
  );
}
