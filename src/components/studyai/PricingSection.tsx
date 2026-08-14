'use client';

import { motion } from 'framer-motion';
import { WabiSabiCard } from './WabiSabiCard';
import { SectionHeading } from './SectionHeading';
import { ZenButton } from './ZenButton';
import { Check, Star, Sparkles, BookOpen, Swords, GraduationCap } from 'lucide-react';

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

interface PlanData {
  name: string;
  japaneseName: string;
  subtitle: string;
  price: string;
  annualPrice?: string;
  period: string;
  features: PlanFeature[];
  highlighted: boolean;
  cta: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const plans: PlanData[] = [
  {
    name: 'Shojin',
    japaneseName: '精進',
    subtitle: 'Para quem começa',
    price: 'Grátis',
    period: '',
    icon: <BookOpen size={24} className="text-[var(--ws-text-tertiary)]" />,
    features: [
      { text: '3 cadernos de estudo' },
      { text: 'Chat com Sensei IA (20 msgs/dia)' },
      { text: 'Flashcards básicos' },
      { text: 'Pomodoro timer' },
      { text: 'Tarefas e Metas' },
      { text: 'Calendário' },
    ],
    highlighted: false,
    cta: 'Começar Grátis',
  },
  {
    name: 'Samurai',
    japaneseName: '侍',
    subtitle: 'Para quem quer evoluir nos estudos',
    price: 'R$ 19,90',
    annualPrice: 'R$ 199,00/ano (≈ R$ 16,58/mês)',
    period: '/mês',
    icon: <Swords size={24} className="text-amber-500" />,
    badge: 'Mais popular',
    badgeColor: 'bg-amber-500',
    features: [
      { text: 'Acesso completo aos materiais' },
      { text: 'Resumos inteligentes com IA' },
      { text: 'IA para tirar dúvidas' },
      { text: 'Organização dos materiais' },
      { text: 'Flashcards' },
      { text: 'Exercícios' },
      { text: 'Plano de estudos personalizado', highlight: true },
      { text: 'Acompanhamento do progresso' },
      { text: 'Histórico de estudos' },
      { text: 'Metas de estudo' },
      { text: 'Dashboard de desempenho' },
      { text: 'Acesso pelo celular e computador' },
      { text: 'Limite maior de interações com a IA' },
    ],
    highlighted: true,
    cta: 'Começar com Samurai',
  },
  {
    name: 'Sensei',
    japaneseName: '先生',
    subtitle: 'Para quem quer levar os estudos ao próximo nível',
    price: 'R$ 34,90',
    annualPrice: 'R$ 349,00/ano (≈ R$ 29,08/mês)',
    period: '/mês',
    icon: <GraduationCap size={24} className="text-violet-500" />,
    badge: 'Experiência completa',
    badgeColor: 'bg-violet-500',
    features: [
      { text: 'Tudo do plano Samurai' },
      { text: 'IA avançada / Sensei IA', highlight: true },
      { text: 'Limite muito maior de perguntas para IA' },
      { text: 'Resumos avançados' },
      { text: 'Geração automática de questões', highlight: true },
      { text: 'Geração automática de simulados', highlight: true },
      { text: 'Correção e explicação dos exercícios' },
      { text: 'Plano de estudos adaptativo' },
      { text: 'Identifica pontos de dificuldade', highlight: true },
      { text: 'Recomendações personalizadas de estudo' },
      { text: 'Revisão inteligente' },
      { text: 'Flashcards gerados automaticamente pela IA' },
      { text: 'Prioridade no processamento da IA' },
    ],
    highlighted: false,
    cta: 'Quero ser Sensei',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[var(--ws-bg-dark)] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-24">
        <SectionHeading
          japaneseSubtitle="料金"
          title="Escolha seu caminho"
          description="Comece de graça com 7 dias grátis nos planos pagos. Cancele a qualquer momento."
          align="center"
        />

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-500">
          <Sparkles size={16} />
          <span className="font-medium">7 dias grátis para testar — cancele quando quiser</span>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative ${plan.highlighted ? 'md:-mt-4 md:mb-[-16px] z-10' : 'z-0'}`}
            >
              <WabiSabiCard
                className={`h-full ${
                  plan.highlighted
                    ? 'border-amber-500/30 shadow-[var(--ws-shadow-enso)]'
                    : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`mb-4 inline-flex items-center gap-1.5 rounded-ws-button ${plan.badgeColor || 'bg-[var(--ws-accent)]'} px-3 py-1 text-xs font-bold uppercase tracking-wider text-white`}>
                    <Star size={12} fill="currentColor" />
                    {plan.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                  plan.name === 'Samurai'
                    ? 'bg-amber-500/15'
                    : plan.name === 'Sensei'
                    ? 'bg-violet-500/15'
                    : 'bg-[color-mix(in_srgb,var(--ws-accent)_8%,transparent)]'
                }`}>
                  {plan.icon}
                </div>

                {/* Plan name */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-serif-jp text-sm text-[var(--ws-text-tertiary)]">{plan.japaneseName}</span>
                </div>
                <h3 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">{plan.name}</h3>
                <p className="mb-4 text-xs text-[var(--ws-text-tertiary)]">{plan.subtitle}</p>

                {/* Price */}
                <div className="mb-2 flex items-baseline gap-1">
                  <span className={`font-serif-jp text-4xl font-bold ${
                    plan.highlighted ? 'text-amber-500' : 'text-[var(--ws-text-primary)]'
                  }`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-[var(--ws-text-tertiary)]">{plan.period}</span>
                  )}
                </div>

                {/* Annual price */}
                {plan.annualPrice && (
                  <p className="mb-6 text-xs text-green-500">
                    {plan.annualPrice}
                  </p>
                )}

                {/* Features */}
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5 text-sm">
                      <Check
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${
                          f.highlight
                            ? 'text-[var(--ws-gold)]'
                            : plan.highlighted
                              ? 'text-amber-500'
                              : 'text-[var(--ws-text-tertiary)]'
                        }`}
                        strokeWidth={f.highlight ? 2.5 : 2}
                      />
                      <span className={`${
                        f.highlight
                          ? 'font-medium text-[var(--ws-text-primary)]'
                          : 'text-[var(--ws-text-secondary)]'
                      }`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <ZenButton
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full"
                  onClick={() => (window as any).__studyai_openAuth?.('register')}
                >
                  {plan.cta}
                </ZenButton>
              </WabiSabiCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
