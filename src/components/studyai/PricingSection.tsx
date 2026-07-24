'use client';

import { motion } from 'framer-motion';
import { WabiSabiCard } from './WabiSabiCard';
import { SectionHeading } from './SectionHeading';
import { ZenButton } from './ZenButton';
import { Check, Star } from 'lucide-react';

const plans = [
  {
    name: 'Shojin',
    subtitle: 'Para quem começa',
    price: 'Grátis',
    period: '',
    features: [
      '3 cadernos de estudo',
      'Chat com Sensei IA (20 msgs/dia)',
      'Flashcards básicos',
      'Pomodoro timer',
      'Dashboard simples',
    ],
    highlighted: false,
    cta: 'Começar Grátis',
  },
  {
    name: 'Samurai',
    subtitle: 'Para o estudante dedicado',
    price: 'R$ 29',
    period: '/mês',
    features: [
      'Cadernos ilimitados',
      'Chat ilimitado com Sensei IA',
      'Flashcards avançados com IA',
      'Resumos automáticos',
      'Quiz gerado por IA',
      'Dashboard completo',
      'Spaced repetition',
      'Exportar notas',
    ],
    highlighted: true,
    cta: 'Assinar Samurai',
  },
  {
    name: 'Sensei',
    subtitle: 'Para mestres do conhecimento',
    price: 'R$ 59',
    period: '/mês',
    features: [
      'Tudo do Samurai',
      'Tutoria IA personalizada',
      'Análise de padrões de estudo',
      'Comunidade exclusiva',
      'API de acesso',
      'Suporte prioritário',
      'Planos de estudo personalizados',
      'Integração com calendário',
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
              className={`relative ${plan.highlighted ? 'md:-mt-4 md:mb-[-16px]' : ''}`}
            >
              <WabiSabiCard
                className={`h-full ${
                  plan.highlighted
                    ? 'border-[var(--ws-accent)]/20 shadow-[var(--ws-shadow-enso)]'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-ws-button bg-[var(--ws-accent)] px-3 py-1 text-xs font-medium text-[var(--ws-text-on-dark)]">
                    <Star size={12} fill="currentColor" />
                    Mais Popular
                  </div>
                )}

                <div className="mb-1">
                  <span className="font-serif-jp text-sm text-[var(--ws-text-tertiary)]">{plan.name}</span>
                </div>
                <p className="mb-4 text-xs text-[var(--ws-text-tertiary)]">{plan.subtitle}</p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="font-serif-jp text-4xl font-bold text-[var(--ws-text-primary)]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-[var(--ws-text-tertiary)]">{plan.period}</span>
                  )}
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--ws-text-secondary)]">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-[var(--ws-accent)]" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <ZenButton
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full"
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
