'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './SectionHeading';
import { EnsoCircle } from './EnsoCircle';
import { PenTool, Brain, Sparkles, GraduationCap } from 'lucide-react';

const steps = [
  {
    num: '01',
    Icon: PenTool,
    title: 'Escreva suas anotações',
    desc: 'Comece digitando ou colando seu material de estudo. Nosso editor inteligente organiza tudo automaticamente.',
  },
  {
    num: '02',
    Icon: Brain,
    title: 'Sensei IA analisa',
    desc: 'Nossa IA identifica conceitos-chave, gera resumos e cria flashcards personalizados para você.',
  },
  {
    num: '03',
    Icon: Sparkles,
    title: 'Estude de forma ativa',
    desc: 'Use flashcards, quiz e chat interativo. O sistema adapta a dificuldade ao seu desempenho.',
  },
  {
    num: '04',
    Icon: GraduationCap,
    title: 'Domine o conteúdo',
    desc: 'Acompanhe seu progresso e revisno nos momentos ideais. A retenção de longo prazo acontece naturalmente.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[var(--ws-bg)] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-24">
        <SectionHeading
          japaneseSubtitle="Michi 道"
          title="O caminho do aprendizado"
          description="Como uma cerimônia do chá, cada etapa tem seu propósito. Siga o caminho zen do conhecimento."
          align="center"
        />

        <div className="relative mt-16">
          {/* Vertical line connecting steps */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-[var(--ws-accent)]/20 via-[var(--ws-accent)]/10 to-transparent lg:left-1/2 lg:block" />

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className={`relative flex flex-col gap-8 lg:flex-row lg:items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8 }}
              >
                {/* Content side */}
                <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right lg:pr-16' : 'lg:text-left lg:pl-16'}`}>
                  <span className="mb-2 inline-block font-serif-jp text-sm text-[var(--ws-accent)]">{step.num}</span>
                  <h3 className="mb-3 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--ws-text-secondary)] lg:text-base">
                    {step.desc}
                  </p>
                </div>

                {/* Center circle */}
                <div className="absolute left-6 z-10 hidden -translate-x-1/2 lg:left-1/2 lg:block">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ws-glass-border)] bg-[var(--ws-bg)]"
                    style={{ boxShadow: 'var(--ws-shadow-soft)' }}
                  >
                    <step.Icon size={22} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Spacer side */}
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
