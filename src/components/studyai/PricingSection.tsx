'use client';

import { motion } from 'framer-motion';
import { WabiSabiCard } from './WabiSabiCard';
import { SectionHeading } from './SectionHeading';
import { ZenButton } from './ZenButton';
import { Check, Star, Crown, Sparkles, Brain, BookOpen, Sword, GraduationCap } from 'lucide-react';

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

interface PlanData {
  name: string;
  japaneseName: string;
  subtitle: string;
  price: string;
  period: string;
  features: PlanFeature[];
  highlighted: boolean;
  cta: string;
  icon: React.ReactNode;
  badge?: string;
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
      { text: 'Dashboard simples' },
      { text: 'Tarefas e Metas' },
      { text: 'Calendário' },
    ],
    highlighted: false,
    cta: 'Começar Grátis',
  },
  {
    name: 'Samurai',
    japaneseName: '侍',
    subtitle: 'Para o estudante dedicado',
    price: 'R$ 29',
    period: '/mês',
    icon: <Crown size={24} className="text-[var(--ws-gold)]" />,
    badge: 'Mais Popular',
    features: [
      { text: 'Tudo do Shojin' },
      { text: 'Cadernos ilimitados' },
      { text: 'Chat ilimitado com Sensei IA' },
      { text: 'Flashcards avançados com IA' },
      { text: 'Resumos automáticos' },
      { text: 'Quiz gerado por IA (Batalha, MicroAula, PreTest)', highlight: true },
      { text: 'Dashboard completo' },
      { text: 'Spaced repetition' },
      { text: 'Exportar notas' },
      { text: 'Ensinar (Técnica Feynman)' },
      { text: 'Roadmap com IA' },
      { text: 'Missões' },
      { text: 'Discover' },
      { text: 'Cérebro (análise completa)' },
    ],
    highlighted: true,
    cta: 'Assinar Samurai',
  },
  {
    name: 'Sensei',
    japaneseName: '先生',
    subtitle: 'Para mestres do conhecimento',
    price: 'R$ 59',
    period: '/mês',
    icon: <Sparkles size={24} className="text-[var(--ws-accent)]" />,
    features: [
      { text: 'Tudo do Samurai' },
      { text: 'Tutoria IA personalizada', highlight: true },
      { text: 'Análise de padrões de estudo', highlight: true },
      { text: 'API de acesso' },
      { text: 'Suporte prioritário' },
      { text: 'Planos de estudo personalizados', highlight: true },
      { text: 'Integração completa com calendário' },
      { text: 'Comunidade exclusiva' },
      { text: 'Conteúdo exclusivo no Discover' },
    ],
    highlighted: false,
    cta: 'Tornar-se Sensei',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[var(--ws-bg-dark)] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-24">
        <SectionHeading
          japaneseSubtitle="料金"
          title="Escolha seu caminho"
          description="Como na jornada do herói, cada nível traz mais profundidade. Comece de graça e evolua quando estiver pronto."
          align="center"
        />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
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
                    ? 'border-[var(--ws-accent)]/30 shadow-[var(--ws-shadow-enso)]'
                    : ''
                }`}
              >
                {/* Icon */}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                  plan.highlighted
                    ? 'bg-[color-mix(in_srgb,var(--ws-gold)_15%,transparent)]'
                    : 'bg-[color-mix(in_srgb,var(--ws-accent)_8%,transparent)]'
                }`}>
                  {plan.icon}
                </div>

                {/* Badge */}
                {plan.badge && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-ws-button bg-[var(--ws-accent)] px-3 py-1 text-xs font-medium text-[var(--ws-text-on-dark)]">
                    <Star size={12} fill="currentColor" />
                    {plan.badge}
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-serif-jp text-sm text-[var(--ws-text-tertiary)]">{plan.japaneseName}</span>
                </div>
                <h3 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">{plan.name}</h3>
                <p className="mb-4 text-xs text-[var(--ws-text-tertiary)]">{plan.subtitle}</p>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-1">
                  <span className={`font-serif-jp text-4xl font-bold ${
                    plan.highlighted ? 'text-[var(--ws-gold)]' : 'text-[var(--ws-text-primary)]'
                  }`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-[var(--ws-text-tertiary)]">{plan.period}</span>
                  )}
                </div>

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
                              ? 'text-[var(--ws-accent)]'
                              : 'text-[var(--ws-text-tertiary)]'
                        }`}
                        strokeWidth={f.highlight ? 2.5 : 2}
                      />
                      <span className={`
                        ${f.highlight
                          ? 'font-medium text-[var(--ws-text-primary)]'
                          : 'text-[var(--ws-text-secondary)]'
                        }
                      `}>
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
