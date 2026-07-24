'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { EnsoCircle } from './EnsoCircle';
import { SeigaihaPattern } from './SeigaihaPattern';
import { WoodblockTexture } from './WoodblockTexture';
import { FloatingElements } from './FloatingElements';
import { ParticlesEffect } from './ParticlesEffect';
import { ZenButton } from './ZenButton';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollY, [0, 500], [0, -80]);
  const ensoScale = useTransform(scrollY, [0, 500], [1, 1.15]);
  const ensoOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-[var(--ws-bg)]"
    >
      {/* Background layers */}
      <SeigaihaPattern className="absolute inset-0 opacity-[0.03]" scale={1.5} />
      <WoodblockTexture className="absolute inset-0 opacity-[0.015] mix-blend-multiply" />

      {/* Main container */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pt-24 lg:px-24">
        <div className="grid min-h-[calc(100vh-120px)] items-center gap-8 lg:grid-cols-12">
          {/* Left Column - Text */}
          <motion.div
            className="lg:col-span-5 lg:col-start-2"
            style={{ y: textY }}
          >
            {/* Hanko Seal */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
              className="mb-8"
            >
              <div className="inline-block rounded-ws-button border-2 border-[var(--ws-accent)] px-5 py-1.5">
                <span className="font-serif-jp text-sm tracking-[0.3em] text-[var(--ws-accent)]">
                  学習 AI
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="font-serif-jp text-5xl font-bold leading-[1.1] tracking-tight text-[var(--ws-text-primary)] lg:text-7xl"
            >
              A beleza de{' '}
              <span className="relative inline-block">
                <span className="relative z-10">aprender</span>
                <svg
                  className="absolute -bottom-1 left-0 z-0 h-5 w-full opacity-30"
                  style={{ color: 'var(--ws-accent)' }}
                  viewBox="0 0 200 20"
                >
                  <path
                    d="M0,15 Q50,5 100,15 Q150,25 200,10"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              na imperfeição
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-[var(--ws-text-secondary)] lg:text-lg"
            >
              Uma plataforma de estudos que respeita seu ritmo natural.
              Como um jardim japonês, seu conhecimento cresce
              organicamente, sem pressa, sem perfeição forçada.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <ZenButton variant="primary" size="lg" onClick={() => (window as any).__studyai_openAuth?.('register')}>
                Começar Jornada <ArrowRight size={16} />
              </ZenButton>
              <ZenButton variant="secondary" size="lg" onClick={() => (window as any).__studyai_openAuth?.('login')}>
                Ver Demonstração
              </ZenButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-12 flex flex-wrap items-center gap-6 text-sm text-[var(--ws-text-tertiary)]"
            >
              {[['+100 mil', 'estudantes'], ['98%', 'satisfação'], ['40+', 'universidades']].map(
                ([value, label], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-1 w-10 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 25%, transparent)' }} />
                    <span>
                      <strong className="text-[var(--ws-text-secondary)]">{value}</strong> {label}
                    </span>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>

          {/* Right Column - Enso Circle */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="relative flex items-center justify-center">
              <motion.div
                style={{ scale: ensoScale, opacity: ensoOpacity }}
                className="relative"
              >
                <EnsoCircle
                  size={420}
                  strokeWidth={3}
                  color="var(--ws-ink)"
                  imperfection={0.12}
                  className="drop-shadow-[var(--ws-shadow-enso)]"
                />

                <FloatingElements />

                {/* Glassmorphism mini dashboard inside the circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-64 rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-5 shadow-[var(--ws-shadow-medium)] backdrop-blur-xl sm:w-72"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-3 w-20 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 10%, transparent)' }} />
                      <div className="h-3 w-3 rounded-full bg-[var(--ws-accent)]" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 5%, transparent)' }} />
                      <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 5%, transparent)' }} />
                      <div className="h-2 w-5/6 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 5%, transparent)' }} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-7 w-7 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' }} />
                      <div className="h-7 flex-1 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 5%, transparent)' }} />
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[10px] text-[var(--ws-text-tertiary)]">
                        <span>Progresso hoje</span>
                        <span>73%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-ink) 5%, transparent)' }}>
                        <motion.div
                          className="h-full rounded-full bg-[var(--ws-accent)]"
                          initial={{ width: 0 }}
                          animate={{ width: '73%' }}
                          transition={{ duration: 1.5, delay: 1.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--ws-bg-dark)] to-transparent" />

      <ParticlesEffect count={12} />
    </section>
  );
}
