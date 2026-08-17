'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WabiSabiCard } from './WabiSabiCard';
import { SectionHeading } from './SectionHeading';
import { ZenButton } from './ZenButton';
import {
  Check, Star, Sparkles, BookOpen, Swords, GraduationCap,
  ChevronDown, X,
} from 'lucide-react';

/* ── Types ── */
type BillingCycle = 'monthly' | 'annual';

/* ── Data ── */
const PLANS = [
  {
    id: 'shojin',
    name: 'Shojin',
    jp: '精進',
    subtitle: 'Para quem começa',
    price: 'Grátis',
    period: '',
    icon: BookOpen,
    iconColor: 'text-[var(--ws-text-tertiary)]',
    iconBg: 'bg-[color-mix(in_srgb,var(--ws-text-tertiary)_10%,transparent)]',
    features: [
      '3 cadernos de estudo',
      'Chat com Sensei IA (20 msgs/dia)',
      'Flashcards básicos',
      'Pomodoro timer',
      'Tarefas e Metas',
      'Calendário',
    ],
    cta: 'Começar Grátis',
    ctaVariant: 'secondary' as const,
  },
  {
    id: 'samurai',
    name: 'Samurai',
    jp: '侍',
    subtitle: 'Para quem quer evoluir nos estudos.',
    price: '19,90',
    annualPrice: '199,00',
    monthlyEquiv: '16,58',
    period: '/mês',
    icon: Swords,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/15',
    badge: 'Mais popular',
    badgeColor: 'bg-amber-500',
    features: [
      'Acesso completo aos materiais',
      'Resumos inteligentes com IA',
      'IA para tirar dúvidas',
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
    ],
    cta: 'Começar com Samurai',
    ctaVariant: 'primary' as const,
    highlighted: true,
  },
  {
    id: 'sensei',
    name: 'Sensei',
    jp: '先生',
    subtitle: 'Para quem quer levar os estudos ao próximo nível.',
    price: '34,90',
    annualPrice: '349,00',
    monthlyEquiv: '29,08',
    period: '/mês',
    icon: GraduationCap,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/15',
    badge: 'Experiência completa',
    badgeColor: 'bg-violet-500',
    features: [
      'Tudo do plano Samurai',
      'IA avançada / Sensei IA',
      'Limite muito maior de perguntas',
      'Resumos avançados',
      'Geração automática de questões',
      'Geração automática de simulados',
      'Correção e explicação dos exercícios',
      'Plano de estudos adaptativo',
      'Identifica pontos de dificuldade',
      'Recomendações personalizadas',
      'Revisão inteligente',
      'Flashcards automáticos com IA',
      'Prioridade no processamento da IA',
    ],
    cta: 'Quero ser Sensei',
    ctaVariant: 'secondary' as const,
  },
];

/* ── Feature Comparison ── */
const COMPARISON = [
  { name: 'Resumos com IA', shojin: false, samurai: 'Básicos', sensei: 'Avançados' },
  { name: 'IA para dúvidas', shojin: '20 msgs/dia', samurai: 'Ilimitado', sensei: 'IA avançada' },
  { name: 'Flashcards', shojin: 'Limitados', samurai: true, sensei: 'Automáticos' },
  { name: 'Exercícios', shojin: true, samurai: true, sensei: 'Gerados por IA' },
  { name: 'Plano de estudos', shojin: true, samurai: 'Personalizado', sensei: 'Adaptativo' },
  { name: 'Metas', shojin: true, samurai: true, sensei: true },
  { name: 'Progresso', shojin: false, samurai: true, sensei: 'Avançado' },
  { name: 'Simulados', shojin: false, samurai: false, sensei: true },
  { name: 'Geração de questões', shojin: false, samurai: false, sensei: true },
  { name: 'Correção inteligente', shojin: false, samurai: false, sensei: true },
  { name: 'Identificação de dificuldades', shojin: false, samurai: false, sensei: true },
  { name: 'Revisão inteligente', shojin: false, samurai: false, sensei: true },
];

/* ── Component ── */
export function PricingSection() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [showComparison, setShowComparison] = useState(false);
  const isAnnual = billing === 'annual';

  return (
    <section id="pricing" className="bg-[var(--ws-bg-dark)] py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          japaneseSubtitle="料金"
          title="Escolha seu caminho"
          description="Comece de graça. Evolua quando estiver pronto. Cancele a qualquer momento."
          align="center"
        />

        {/* Trial badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Sparkles size={16} className="text-[var(--ws-verdigris)]" />
          <span className="font-medium text-[var(--ws-verdigris)]">7 dias grátis para testar</span>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-tertiary)]'}`}>
            Mensal
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-[var(--ws-verdigris)]' : 'bg-[var(--ws-glass-border)]'}`}
            aria-label="Alternar cobrança"
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
              Economia de 2 meses
            </motion.span>
          )}
        </div>

        {/* Plan Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={plan.highlighted ? 'lg:-mt-4 lg:mb-[-16px] lg:z-10' : ''}
              >
                <WabiSabiCard
                  className={`flex h-full flex-col ${plan.highlighted
                      ? 'border-amber-500/30 shadow-[var(--ws-shadow-enso)]'
                      : ''
                    }`}
                >
                  {/* Header */}
                  <div className="flex-1">
                    {/* Badge */}
                    {plan.badge && (
                      <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full ${plan.badgeColor} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}>
                        <Star size={10} fill="currentColor" />
                        {plan.badge}
                      </div>
                    )}

                    {/* Icon + Name */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${plan.iconBg}`}>
                        <Icon size={20} className={plan.iconColor} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif-jp text-xs text-[var(--ws-text-tertiary)]">{plan.jp}</span>
                        </div>
                        <h3 className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">{plan.name}</h3>
                      </div>
                    </div>

                    <p className="mb-4 text-xs text-[var(--ws-text-tertiary)]">{plan.subtitle}</p>

                    {/* Price */}
                    <div className="mb-1">
                      {plan.price === 'Grátis' ? (
                        <span className="font-serif-jp text-3xl font-bold text-[var(--ws-text-primary)]">Grátis</span>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className={`font-serif-jp text-3xl font-bold ${plan.highlighted ? 'text-amber-500' : 'text-[var(--ws-text-primary)]'}`}>
                              R$ {isAnnual && plan.annualPrice ? plan.annualPrice : plan.price}
                            </span>
                            <span className="text-sm text-[var(--ws-text-tertiary)]">
                              {isAnnual ? '/ano' : plan.period}
                            </span>
                          </div>
                          {isAnnual && plan.monthlyEquiv && (
                            <p className="mt-1 text-xs text-green-500">
                              ≈ R$ {plan.monthlyEquiv}/mês
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check
                            size={15}
                            className={`mt-0.5 shrink-0 ${plan.highlighted ? 'text-amber-500' : 'text-[var(--ws-text-tertiary)]'}`}
                          />
                          <span className="text-[var(--ws-text-secondary)]">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                    {/* CTA */}
                    <div className="mt-8">
                      <ZenButton
                        variant={plan.ctaVariant}
                        size="md"
                        className="w-full"
                        onClick={() => {
                          if (plan.id === 'shojin') {
                            (window as any).__studyai_openAuth?.('register');
                          } else {
                            (window as any).__studyai_openAuth?.({
                              mode: 'register',
                              plan: plan.id.toUpperCase() as 'SAMURAI' | 'SENSEI',
                              billing,
                            });
                          }
                        }}
                      >
                        {plan.cta}
                      </ZenButton>
                      {plan.id !== 'shojin' && (
                        <p className="mt-2 text-center text-[10px] text-[var(--ws-text-tertiary)]">
                          7 dias grátis · Cancele quando quiser
                        </p>
                      )}
                    </div>
                </WabiSabiCard>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison table toggle */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowComparison(v => !v)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-text-secondary)]"
          >
            Comparar todos os recursos
            <ChevronDown size={16} className={`transition-transform duration-200 ${showComparison ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Comparison table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--ws-glass-border)] bg-[var(--ws-glass)]">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--ws-glass-border)]">
                      <th className="px-4 py-3 text-left font-medium text-[var(--ws-text-tertiary)]">Recurso</th>
                      <th className="px-4 py-3 text-center font-medium text-[var(--ws-text-tertiary)]">🥋 Shojin</th>
                      <th className="px-4 py-3 text-center font-medium text-amber-500">🥋 Samurai</th>
                      <th className="px-4 py-3 text-center font-medium text-violet-500">🧠 Sensei</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr key={row.name} className={`border-b border-[var(--ws-glass-border)]/50 ${i % 2 === 0 ? 'bg-[var(--ws-bg)]/30' : ''}`}>
                        <td className="px-4 py-3 text-[var(--ws-text-secondary)]">{row.name}</td>
                        <td className="px-4 py-3 text-center"><CellValue value={row.shojin} /></td>
                        <td className="px-4 py-3 text-center"><CellValue value={row.samurai} accent /></td>
                        <td className="px-4 py-3 text-center"><CellValue value={row.sensei} accent /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom trust */}
        <p className="mt-10 text-center text-xs text-[var(--ws-text-tertiary)]">
          Pagamento seguro via Stripe · Precios em Reais (BRL) · Cancele a qualquer momento
        </p>
      </div>
    </section>
  );
}

/* ── Cell value renderer ── */
function CellValue({ value, accent = false }: { value: string | boolean; accent?: boolean }) {
  if (value === true) {
    return <Check size={16} className={`mx-auto ${accent ? 'text-green-500' : 'text-[var(--ws-verdigris)]'}`} />;
  }
  if (value === false) {
    return <span className="text-[var(--ws-text-tertiary)] opacity-30">—</span>;
  }
  return (
    <span className={`text-xs font-medium ${accent ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-secondary)]'}`}>
      {value}
    </span>
  );
}
