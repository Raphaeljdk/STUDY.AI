'use client';

import { motion } from 'framer-motion';
import { WabiSabiCard } from './WabiSabiCard';
import { SectionHeading } from './SectionHeading';
import { EnsoDivider } from './EnsoDivider';
import {
  Brain,
  BookOpen,
  BarChart3,
  MessageCircle,
  Layers,
  Sparkles,
  Clock,
  Users,
  GraduationCap,
} from 'lucide-react';

const features = [
  {
    Icon: Brain,
    title: 'Tutor IA Adaptativo',
    desc: 'Aprenda no seu ritmo com um tutor que se ajusta ao seu nível de conhecimento e estilo.',
  },
  {
    Icon: BookOpen,
    title: 'Cadernos Inteligentes',
    desc: 'Organize seus estudos como um jardim zen. Cada caderno cresce organicamente.',
  },
  {
    Icon: BarChart3,
    title: 'Insights Profundos',
    desc: 'Visualize seu progresso com dashboards que revelam padrões de aprendizado.',
  },
  {
    Icon: MessageCircle,
    title: 'Chat com Sensei',
    desc: 'Converse com seu tutor pessoal em português, esclarecendo dúvidas instantaneamente.',
  },
  {
    Icon: Layers,
    title: 'Flashcards Espaçados',
    desc: 'Revisão baseada em spaced repetition, otimizando retenção a longo prazo.',
  },
  {
    Icon: Sparkles,
    title: 'Resumos com IA',
    desc: 'Gere resumos, mapas mentais e questões automaticamente a partir de seus estudos.',
  },
  {
    Icon: Clock,
    title: 'Pomodoro Zen',
    desc: 'Sessões de estudo com temporizador que respeita seus ciclos naturais de foco.',
  },
  {
    Icon: Users,
    title: 'Comunidade Wabi-Sabi',
    desc: 'Compartilhe conhecimento em uma comunidade que valoriza o processo.',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[var(--ws-bg-dark)] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-24">
        <SectionHeading
          japaneseSubtitle="私たちの哲学"
          title="A beleza do aprendizado imperfeito"
          description="Cada ferramenta foi desenhada para respeitar seu ritmo. Como na arte Wabi-Sabi, a perfeição está na jornada, não no destino."
        />

        <EnsoDivider />

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={itemVariants}>
              <WabiSabiCard className="h-full">
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-ws-button"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)',
                  }}
                >
                  <f.Icon size={20} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--ws-text-secondary)]">
                  {f.desc}
                </p>
              </WabiSabiCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
