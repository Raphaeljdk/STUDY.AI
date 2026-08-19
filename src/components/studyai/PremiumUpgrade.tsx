'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, Check, X, Loader2, Sparkles,
  Swords, GraduationCap, Brain, Target, Route,
  MessageCircle, BarChart3, Shield, ChevronDown, ExternalLink, Star, Flame,
} from 'lucide-react';
import { ZenButton } from './ZenButton';
import { apiFetch, ApiError } from '@/lib/api';

/* ── Types ── */

type PlanTier = 'SAMURAI' | 'SENSEI';
type BillingCycle = 'monthly' | 'annual';

type TriggerType = 'chat' | 'flashcards' | 'nav';

interface PremiumUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
  triggerType?: TriggerType;
}

/* ── Plan Data ── */

const PLANS = {
  SAMURAI: {
    name: 'Samurai',
    tier: 'Pro',
    icon: Swords,
    monthly: 19.9,
    annual: 199.0,
    monthlyEquiv: 16.58,
    badge: 'Mais popular',
    badgeIcon: Star,
    description: 'Para quem quer evoluir nos estudos.',
    color: 'amber',
  },
  SENSEI: {
    name: 'Sensei',
    tier: 'Premium',
    icon: GraduationCap,
    monthly: 34.9,
    annual: 349.0,
    monthlyEquiv: 29.08,
    badge: 'Experiência completa',
    badgeIcon: Crown,
    description: 'Para quem quer levar os estudos ao próximo nível.',
    color: 'violet',
  },
} as const;

/* ── Feature Comparison ── */

interface FeatureRow {
  name: string;
  icon: any;
  shojin: string | boolean;
  samurai: string | boolean;
  sensei: string | boolean;
}

const FEATURES: FeatureRow[] = [
  { name: 'Resumos inteligentes', icon: Brain, shojin: false, samurai: true, sensei: 'Avançados' },
  { name: 'IA para dúvidas', icon: MessageCircle, shojin: 'Limitado', samurai: true, sensei: 'IA avançada' },
  { name: 'Organização de materiais', icon: Target, shojin: true, samurai: true, sensei: true },
  { name: 'Flashcards', icon: Brain, shojin: 'Limitados', samurai: true, sensei: 'Automáticos' },
  { name: 'Exercícios', icon: Zap, shojin: true, samurai: true, sensei: 'Gerados por IA' },
  { name: 'Plano de estudos', icon: Route, shojin: true, samurai: true, sensei: 'Adaptativo' },
  { name: 'Metas', icon: Target, shojin: true, samurai: true, sensei: true },
  { name: 'Progresso', icon: BarChart3, shojin: false, samurai: true, sensei: 'Avançado' },
  { name: 'Simulados', icon: Shield, shojin: false, samurai: false, sensei: true },
  { name: 'Geração de questões', icon: Sparkles, shojin: false, samurai: false, sensei: true },
  { name: 'Correção inteligente', icon: Check, shojin: false, samurai: false, sensei: true },
  { name: 'Identificação de dificuldades', icon: Flame, shojin: false, samurai: false, sensei: true },
  { name: 'Recomendações personalizadas', icon: Sparkles, shojin: false, samurai: false, sensei: true },
  { name: 'Revisão inteligente', icon: Brain, shojin: false, samurai: false, sensei: true },
];

/* ── Component ── */

export function PremiumUpgrade({ isOpen, onClose, triggerType }: PremiumUpgradeProps) {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);
  const [error, setError] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  const isAnnual = billing === 'annual';

  const handleCheckout = async (planTier: PlanTier) => {
    setLoadingPlan(planTier);
    setError('');
    try {
      const data = await apiFetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: planTier, billing }),
      });

      if (data.code === 'STRIPE_NOT_CONFIGURED') {
        setError('Pagamento indisponível no momento. Tente novamente mais tarde.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Não foi possível iniciar o pagamento.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const triggerMessages: Record<string, { title: string; desc: string }> = {
    chat: { title: 'Limite de mensagens atingido', desc: 'Desbloqueie conversas ilimitadas com a IA!' },
    flashcards: { title: 'Limite de flashcards atingido', desc: 'Crie flashcards ilimitados com IA!' },
    nav: { title: 'Desbloqueie o poder total do StudyAI', desc: 'Escolha o plano perfeito para sua jornada de estudos.' },
  };

  const msg = triggerMessages[triggerType || 'nav'];

  const trialDays = 7;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-y-auto sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!loadingPlan ? onClose : undefined} />

          <motion.div
            className="relative z-10 w-full max-w-4xl mb-0 sm:mb-8 max-h-[100dvh] sm:max-h-none overflow-y-auto rounded-t-2xl sm:rounded-ws-organic"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={!!loadingPlan}
              className="absolute top-3 right-3 z-20 rounded-full bg-[var(--ws-glass)] p-2 text-[var(--ws-text-tertiary)] shadow-lg transition-colors hover:text-[var(--ws-text-primary)] disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {/* Main card */}
            <div className="overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] shadow-[var(--ws-shadow-medium)]">
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 via-[var(--ws-ink)] to-amber-950/20 px-8 py-10 text-center">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ws-bg)] to-transparent opacity-30" />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
                    <Crown size={32} className="text-amber-500" />
                  </div>
                  <h2 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] sm:text-3xl">
                    Escolha seu plano
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ws-text-secondary)]">
                    {msg.desc}
                  </p>

                  {/* Billing toggle */}
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-tertiary)]'}`}>
                      Mensal
                    </span>
                    <button
                      onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                      className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
                        isAnnual ? 'bg-amber-500' : 'bg-[var(--ws-glass-border)]'
                      }`}
                      aria-label="Alternar cobrança mensal/anual"
                    >
                      <motion.div
                        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md"
                        animate={{ left: isAnnual ? '22px' : '2px' }}
                        transition={{ duration: 0.2 }}
                      />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-tertiary)]'}`}>
                      Anual
                    </span>
                    {isAnnual && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-500"
                      >
                        Economize 2 meses
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="p-4 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Samurai Card */}
                  <PlanCard
                    plan={PLANS.SAMURAI}
                    isAnnual={isAnnual}
                    loading={loadingPlan === 'SAMURAI'}
                    onSelect={() => handleCheckout('SAMURAI')}
                    trialDays={trialDays}
                    highlighted={false}
                  />

                  {/* Sensei Card */}
                  <PlanCard
                    plan={PLANS.SENSEI}
                    isAnnual={isAnnual}
                    loading={loadingPlan === 'SENSEI'}
                    onSelect={() => handleCheckout('SENSEI')}
                    trialDays={trialDays}
                    highlighted={true}
                  />
                </div>

                {/* Annual savings banner */}
                {isAnnual && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center justify-center gap-2 rounded-ws-button bg-green-500/5 border border-green-500/20 px-4 py-3 text-center"
                  >
                    <Sparkles size={16} className="text-green-500" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      <strong>Samurai anual:</strong> R$ 199,00/ano (≈ R$ 16,58/mês) ·
                      <strong> Sensei anual:</strong> R$ 349,00/ano (≈ R$ 29,08/mês)
                    </p>
                  </motion.div>
                )}

                {/* Feature comparison toggle */}
                <div className="mt-8">
                  <button
                    onClick={() => setShowComparison(v => !v)}
                    className="mx-auto flex items-center gap-2 text-sm font-medium text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-text-secondary)]"
                  >
                    Comparar todos os recursos
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${showComparison ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showComparison && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 overflow-x-auto rounded-ws-button border border-[var(--ws-glass-border)]">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--ws-glass-border)]">
                                <th className="px-4 py-3 text-left font-medium text-[var(--ws-text-tertiary)]">Recurso</th>
                                <th className="px-4 py-3 text-center font-medium text-[var(--ws-text-tertiary)]">🥋 Shojin</th>
                                <th className="px-4 py-3 text-center font-medium text-amber-500">🥋 Samurai</th>
                                <th className="px-4 py-3 text-center font-medium text-violet-500">🧠 Sensei</th>
                              </tr>
                            </thead>
                            <tbody>
                              {FEATURES.map((feature, i) => (
                                <tr key={feature.name} className={i % 2 === 0 ? 'bg-[var(--ws-glass)]/30' : ''}>
                                  <td className="flex items-center gap-2 px-4 py-2.5 text-[var(--ws-text-secondary)]">
                                    <feature.icon size={14} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                                    {feature.name}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <FeatureValue value={feature.shojin} />
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <FeatureValue value={feature.samurai} accent />
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <FeatureValue value={feature.sensei} accent />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Footer note */}
                <p className="mt-6 text-center text-[10px] text-[var(--ws-text-tertiary)]">
                  Pagamento seguro via Stripe · 7 dias grátis · Cancele a qualquer momento
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Plan Card ── */

function PlanCard({
  plan,
  isAnnual,
  loading,
  onSelect,
  trialDays,
  highlighted,
}: {
  plan: typeof PLANS.SAMURAI | typeof PLANS.SENSEI;
  isAnnual: boolean;
  loading: boolean;
  onSelect: () => void;
  trialDays: number;
  highlighted: boolean;
}) {
  const Icon = plan.icon;
  const BadgeIcon = plan.badgeIcon;
  const price = isAnnual ? plan.annual : plan.monthly;
  const periodLabel = isAnnual ? '/ano' : '/mês';

  const isSensei = plan.name === 'Sensei';
  const accentClass = isSensei
    ? 'border-violet-500/30 bg-violet-500/5'
    : 'border-amber-500/30 bg-amber-500/5';
  const textAccentClass = isSensei ? 'text-violet-500' : 'text-amber-500';
  const btnClass = isSensei
    ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white';

  return (
    <div
      className={`relative flex flex-col rounded-ws-organic border p-6 transition-shadow ${
        highlighted
          ? `${accentClass} shadow-lg ring-1 ${isSensei ? 'ring-violet-500/20' : 'ring-amber-500/20'}`
          : 'border-[var(--ws-glass-border)] bg-[var(--ws-glass)]'
      }`}
    >
      {/* Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          isSensei
            ? 'bg-violet-500 text-white'
            : 'bg-amber-500 text-white'
        }`}>
          <BadgeIcon size={10} />
          {plan.badge}
        </span>
      </div>

      {/* Plan icon + name */}
      <div className="mb-4 mt-2 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isSensei ? 'bg-violet-500/15' : 'bg-amber-500/15'
        }`}>
          <Icon size={20} className={textAccentClass} />
        </div>
        <div>
          <h3 className={`font-serif-jp text-lg font-bold ${
            isSensei ? 'text-violet-400' : 'text-amber-500'
          }`}>
            🥋 {plan.name}
          </h3>
          <p className="text-xs text-[var(--ws-text-tertiary)]">{plan.tier}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="font-serif-jp text-3xl font-bold text-[var(--ws-text-primary)]">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-[var(--ws-text-tertiary)]">{periodLabel}</span>
        </div>
        {isAnnual && (
          <p className="mt-1 text-xs text-green-500">
            ≈ R$ {plan.monthlyEquiv.toFixed(2).replace('.', ',')}/mês
          </p>
        )}
      </div>

      {/* Description */}
      <p className="mb-5 text-sm text-[var(--ws-text-secondary)]">
        {plan.description}
      </p>

      {/* Features list */}
      <ul className="mb-6 flex-1 space-y-2.5">
        {(isSensei ? SENSEI_FEATURES : SAMURAI_FEATURES).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check size={16} className={`mt-0.5 shrink-0 ${textAccentClass}`} />
            <span className="text-[var(--ws-text-secondary)]">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        disabled={loading}
        className={`w-full rounded-ws-button px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-70 ${btnClass}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Processando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap size={16} />
            {isSensei ? 'Quero ser Sensei' : 'Começar com Samurai'}
          </span>
        )}
      </button>

      {/* Trial note */}
      <p className="mt-3 text-center text-[10px] text-[var(--ws-text-tertiary)]">
        {trialDays} dias grátis para testar
      </p>
    </div>
  );
}

/* ── Feature lists per plan ── */

const SAMURAI_FEATURES = [
  'Acesso completo aos materiais',
  'Resumos inteligentes com IA',
  'IA para tirar dúvidas',
  'Perguntas e respostas sobre conteúdos',
  'Organização dos materiais',
  'Flashcards',
  'Exercícios',
  'Plano de estudos personalizado',
  'Acompanhamento do progresso',
  'Histórico de estudos',
  'Metas de estudo',
  'Dashboard de desempenho',
  'Acesso pelo celular e computador',
  'Limite maior de interações com IA',
] as const;

const SENSEI_FEATURES = [
  'Tudo do plano Samurai',
  'IA avançada / Sensei IA',
  'Limite muito maior de perguntas para IA',
  'Resumos avançados',
  'Geração automática de questões',
  'Geração automática de simulados',
  'Correção e explicação dos exercícios',
  'Plano de estudos adaptativo',
  'A IA identifica pontos de dificuldade',
  'Recomendações personalizadas de estudo',
  'Revisão inteligente',
  'Flashcards gerados automaticamente pela IA',
  'Acompanhamento detalhado de desempenho',
  'Identificação de matérias com baixo desempenho',
  'Sugestão do que estudar a seguir',
  'Prioridade no processamento da IA',
  'Histórico completo de aprendizagem',
] as const;

/* ── Feature Value Cell ── */

function FeatureValue({ value, accent = false }: { value: string | boolean; accent?: boolean }) {
  if (value === true) {
    return <Check size={16} className={`mx-auto ${accent ? 'text-green-500' : 'text-[var(--ws-verdigris)]'}`} />;
  }
  if (value === false) {
    return <X size={16} className="mx-auto text-[var(--ws-text-tertiary)] opacity-40" />;
  }
  return (
    <span className={`text-xs font-medium ${accent ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-secondary)]'}`}>
      {value}
    </span>
  );
}

/* ── Usage Bar ── */

interface UsageData {
  plan: string;
  isPremium: boolean;
  limits: { chatMessages: number; flashcards: number };
  usage: { chatMessages: number; flashcards: number };
  remaining: { chatMessages: number; flashcards: number };
}

export function UsageBar({ type, used, limit }: { type: 'chatMessages' | 'flashcards'; used: number; limit: number }) {
  if (!isFinite(limit)) return null;

  const pct = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(0, limit - used);
  const isLow = remaining <= 1;
  const label = type === 'chatMessages' ? 'mensagens' : 'flashcards';
  const Icon = type === 'chatMessages' ? MessageCircle : Brain;

  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className={isLow ? 'text-amber-500' : 'text-[var(--ws-text-tertiary)]'} />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] text-[var(--ws-text-tertiary)]">
            {remaining} {label} restante{remaining !== 1 ? 's' : ''} hoje
          </span>
          <span className="text-[11px] text-[var(--ws-text-tertiary)]">
            {used}/{limit}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ws-glass-border)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-500' : 'bg-[var(--ws-accent)]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
