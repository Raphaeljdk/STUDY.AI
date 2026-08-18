'use client';

// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Crown, Loader2, ExternalLink, ShieldCheck,
  Swords, GraduationCap, Calendar, AlertTriangle, CheckCircle2,
  ChevronRight, Sparkles,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { WabiSabiCard } from './WabiSabiCard';
import { ZenButton } from './ZenButton';
import { PremiumUpgrade } from './PremiumUpgrade';
import { apiFetch } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// ===== PLAN CONFIG =====
const PLAN_INFO: Record<string, { label: string; emoji: string; color: string; description: string }> = {
  FREE: {
    label: 'Shojin',
    emoji: '\uD83E\uDD1B',
    color: 'var(--ws-text-tertiary)',
    description: 'Plano gratuito com acesso limitado a funcionalidades basicas.',
  },
  SAMURAI: {
    label: 'Samurai',
    emoji: '\uD83E\uDDCB\uFE0F',
    color: 'var(--ws-gold)',
    description: 'Acesso completo a Batalha, MicroAula, Missoes, Discover, Ensinar e mais.',
  },
  SENSEI: {
    label: 'Sensei',
    emoji: '\uD83E\uDDE0',
    color: 'var(--ws-accent)',
    description: 'Tudo do Samurai + recursos avancados de IA, Progresso completo e Simulados.',
  },
};

// ===== MAIN COMPONENT =====
interface SubscriptionViewProps {
  onUpgrade: () => void;
}

export function SubscriptionView({ onUpgrade }: SubscriptionViewProps) {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const rawPlan = (sessionUser?.role === 'ADMIN' ? 'SENSEI' : (sessionUser?.plan || 'FREE'));
  const isAdmin = sessionUser?.role === 'ADMIN';

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const plan = PLAN_INFO[rawPlan] || PLAN_INFO.FREE;
  const isPremium = rawPlan !== 'FREE' || isAdmin;

  const fetchSubscriptionInfo = useCallback(async () => {
    try {
      const data = await apiFetch('/api/stats');
      if (data) {
        setSubscriptionData(data);
      }
    } catch {
      // silent - we already have plan from session
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [fetchSubscriptionInfo]);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const data = await apiFetch('/api/stripe/portal', { method: 'POST' });
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: 'Erro', description: 'Nao foi possivel abrir o portal de gerenciamento.' });
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao abrir portal',
        description: err?.message || 'Nao foi possivel abrir o portal de assinatura.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Voce perdera acesso aos recursos premium ao final do periodo atual.')) return;
    setCancelLoading(true);
    try {
      await apiFetch('/api/stripe/cancel', { method: 'POST' });
      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada. Voce tera acesso premium ate o final do periodo atual.',
      });
      fetchSubscriptionInfo();
    } catch (err: any) {
      toast({
        title: 'Erro ao cancelar',
        description: err?.message || 'Nao foi possivel cancelar a assinatura.',
        variant: 'destructive',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Get billing period end from session (set by webhook/checkout)
  const periodEnd = sessionUser?.stripeCurrentPeriodEnd;
  const periodEndDate = periodEnd ? new Date(periodEnd) : null;
  const formattedPeriodEnd = periodEndDate
    ? periodEndDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  // Determine if subscription is on monthly or annual
  const isAnnual = sessionUser?.stripePriceId?.includes('annual');
  const billingCycle = isAnnual ? 'Anual' : 'Mensal';

  const priceMap: Record<string, string> = {
    SAMURAI: isAnnual ? 'R$ 199,00/ano' : 'R$ 19,90/mes',
    SENSEI: isAnnual ? 'R$ 349,00/ano' : 'R$ 34,90/mes',
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[var(--ws-accent)]" />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Carregando dados da assinatura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif-jp text-2xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
          Assinatura
        </h1>
        <p className="text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
          Gerencie seu plano e cobranca
        </p>
      </div>

      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <WabiSabiCard className="mb-6" style={{ background: 'var(--ws-glass)' }}>
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center text-2xl"
                  style={{
                    background: isPremium
                      ? `color-mix(in srgb, ${plan.color} 12%, transparent)`
                      : 'color-mix(in srgb, var(--ws-ink) 5%, transparent)',
                    borderRadius: 'var(--ws-radius-card)',
                    border: `1px solid ${isPremium ? `color-mix(in srgb, ${plan.color} 20%, transparent)` : 'var(--ws-glass-border)'}`,
                  }}
                >
                  {rawPlan === 'SENSEI' || isAdmin ? <GraduationCap className="h-6 w-6" style={{ color: plan.color }} /> : rawPlan === 'SAMURAI' ? <Swords className="h-6 w-6" style={{ color: plan.color }} /> : <CreditCard className="h-6 w-6" style={{ color: 'var(--ws-text-tertiary)' }} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>
                      {plan.emoji} {plan.label}
                    </h2>
                    {isPremium && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${plan.color} 12%, transparent)`,
                          color: plan.color,
                        }}
                      >
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>{plan.description}</p>
                </div>
              </div>
            </div>

            {/* Plan Details for Premium Users */}
            {isPremium && !isAdmin && (
              <div
                className="grid grid-cols-2 gap-3 p-3 mt-3"
                style={{
                  background: 'color-mix(in srgb, var(--ws-ink) 3%, transparent)',
                  borderRadius: 'var(--ws-radius-card)',
                  border: '1px solid var(--ws-glass-border)',
                }}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ws-text-tertiary)' }}>
                    Ciclo de cobranca
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                    <Calendar className="inline h-3.5 w-3.5 mr-1 -mt-0.5" style={{ color: 'var(--ws-text-tertiary)' }} />
                    {billingCycle}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ws-text-tertiary)' }}>
                    Valor
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                    {priceMap[rawPlan] || 'N/A'}
                  </p>
                </div>
                {formattedPeriodEnd && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--ws-text-tertiary)' }}>
                      Proxima cobranca
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                      <Calendar className="inline h-3.5 w-3.5 mr-1 -mt-0.5" style={{ color: 'var(--ws-text-tertiary)' }} />
                      {formattedPeriodEnd}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Admin Badge */}
            {isAdmin && (
              <div
                className="flex items-center gap-2 p-3 mt-3"
                style={{
                  background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
                  borderRadius: 'var(--ws-radius-card)',
                  border: '1px solid color-mix(in srgb, var(--ws-accent) 15%, transparent)',
                }}
              >
                <Crown className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--ws-accent)' }}>
                  Conta de administrador com acesso completo a todos os recursos
                </p>
              </div>
            )}
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* FREE plan — Upgrade CTA */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <WabiSabiCard className="mb-6" style={{ background: 'var(--ws-glass)' }}>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center"
                  style={{
                    background: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)',
                    borderRadius: '12px 11px 13px 10px',
                  }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--ws-gold)' }} />
                </div>
                <div>
                  <h3 className="font-serif-jp text-base font-semibold" style={{ color: 'var(--ws-text-primary)' }}>
                    Desbloqueie todo o potencial
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                    Faca upgrade para acessar IA avancada, batalhas, missoes e muito mais.
                  </p>
                </div>
              </div>

              {/* Quick plan comparison */}
              <div className="space-y-2.5 mb-5">
                {[
                  { name: 'Samurai', price: 'R$ 19,90/mes', icon: Swords, color: 'var(--ws-gold)', features: ['Batalha e MicroAula', 'Missoes e Discover', 'Ensinar e Cerebro', 'Roadmap com IA'] },
                  { name: 'Sensei', price: 'R$ 34,90/mes', icon: GraduationCap, color: 'var(--ws-accent)', features: ['Tudo do Samurai', 'Progresso completo', 'Simulados avancados', 'IA avancada'] },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="flex items-start gap-3 p-3"
                    style={{
                      background: 'color-mix(in srgb, var(--ws-ink) 3%, transparent)',
                      borderRadius: 'var(--ws-radius-card)',
                      border: '1px solid var(--ws-glass-border)',
                    }}
                  >
                    <p.icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: p.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>{p.name}</span>
                        <span className="text-xs font-medium" style={{ color: p.color }}>{p.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.features.map((f) => (
                          <span
                            key={f}
                            className="inline-flex items-center gap-1 text-[10px]"
                            style={{ color: 'var(--ws-text-tertiary)' }}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" style={{ color: p.color }} />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <ZenButton
                variant="primary"
                size="md"
                gradient
                className="w-full"
                onClick={() => setShowUpgrade(true)}
              >
                <Crown className="h-4 w-4" />
                Fazer upgrade de plano
              </ZenButton>
            </div>
          </WabiSabiCard>
        </motion.div>
      )}

      {/* Premium — Management Actions */}
      {isPremium && !isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <WabiSabiCard className="mb-6" style={{ background: 'var(--ws-glass)' }}>
            <div className="p-5">
              <h3 className="font-serif-jp text-base font-semibold mb-4" style={{ color: 'var(--ws-text-primary)' }}>
                Gerenciar assinatura
              </h3>

              <div className="space-y-3">
                {/* Stripe Billing Portal */}
                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="flex w-full items-center gap-3 rounded-ws-button p-3.5 text-left transition-ws min-h-[44px]"
                  style={{
                    background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--ws-accent) 15%, transparent)',
                    color: 'var(--ws-text-primary)',
                  }}
                >
                  <ExternalLink className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--ws-accent)' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Portal de cobranca</p>
                    <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                      Gerencie pagamento, faturas e dados no Stripe
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                </button>

                {/* Change Plan */}
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex w-full items-center gap-3 rounded-ws-button p-3.5 text-left transition-ws min-h-[44px]"
                  style={{
                    background: 'color-mix(in srgb, var(--ws-gold) 6%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--ws-gold) 15%, transparent)',
                    color: 'var(--ws-text-primary)',
                  }}
                >
                  <Crown className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--ws-gold)' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Alterar plano</p>
                    <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                      Faca upgrade ou downgrade do seu plano
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                </button>

                {/* Cancel Subscription */}
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="flex w-full items-center gap-3 rounded-ws-button p-3.5 text-left transition-ws min-h-[44px]"
                  style={{
                    background: 'color-mix(in srgb, #DC2626 4%, transparent)',
                    border: '1px solid color-mix(in srgb, #DC2626 12%, transparent)',
                    color: 'var(--ws-text-primary)',
                  }}
                >
                  {cancelLoading ? (
                    <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" style={{ color: '#DC2626' }} />
                  ) : (
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#DC2626' }} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#DC2626' }}>Cancelar assinatura</p>
                    <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                      Voce tera acesso ate o final do periodo atual
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                </button>
              </div>
            </div>
          </WabiSabiCard>
        </motion.div>
      )}

      {/* FAQ / Info section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <WabiSabiCard style={{ background: 'var(--ws-glass)' }}>
          <div className="p-5">
            <h3 className="font-serif-jp text-base font-semibold mb-3" style={{ color: 'var(--ws-text-primary)' }}>
              Perguntas frequentes
            </h3>
            <div className="space-y-3">
              {[
                { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Ao cancelar, voce mantera acesso premium ate o final do periodo ja pago.' },
                { q: 'Posso trocar de plano?', a: 'Sim, voce pode fazer upgrade ou downgrade a qualquer momento. O valor sera proporcional ao periodo restante.' },
                { q: 'O pagamento e recorrente?', a: 'Sim, a cobranca e feita automaticamente no cartao cadastrado no inicio de cada ciclo.' },
                { q: 'Tem teste gratuito?', a: 'Sim! Os planos premium incluem 7 dias gratuitos para experimentar todos os recursos.' },
              ].map((item) => (
                <div key={item.q} className="pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--ws-glass-border)' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--ws-text-primary)' }}>{item.q}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ws-text-tertiary)' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgrade isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} triggerType="nav" />
    </div>
  );
}

export default SubscriptionView;
