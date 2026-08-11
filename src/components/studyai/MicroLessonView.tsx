'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Brain,
  ChevronRight, ArrowRight, RotateCcw, Check, X,
  Zap, Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ===== TYPES =====
interface MicroLessonPhase {
  phase: number;
  title: string;
  emoji: string;
  content: string;
  startSecond: number;
  endSecond: number;
}

interface MicroLessonData {
  id: string;
  topic: string;
  phases: MicroLessonPhase[];
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
}

// ===== TOPIC SUGGESTIONS =====
const TOPIC_SUGGESTIONS = [
  // Programacao & Tecnologia
  'React', 'Typescript', 'Node.js', 'Docker', 'Git',
  'API', 'REST', 'SQL', 'GraphQL', 'POO',
  'Polimorfismo', 'Recursao', 'Heranca', 'Busca binaria',
  // Ciencias
  'Fotossintese', 'Cellula', 'Energia Cinematica',
  // Matematica
  'Derivadas', 'Equacoes do 2 grau', 'Estatistica', 'Logica Proposicional',
  // Historia & Humanidades
  'Revolucao Francesa', 'Periodo Colonial', 'Filosofia',
  // Portugues & Geral
  'Gramatica', 'Imposto de Renda',
];

const PHASE_CONFIG = [
  { phase: 1, title: 'Conceito', emoji: '🎯', startSecond: 0, endSecond: 10 },
  { phase: 2, title: 'Analogia', emoji: '💡', startSecond: 10, endSecond: 25 },
  { phase: 3, title: 'Exemplo', emoji: '📋', startSecond: 25, endSecond: 40 },
  { phase: 4, title: 'Aplicacao', emoji: '🚀', startSecond: 40, endSecond: 50 },
  { phase: 5, title: 'Pergunta', emoji: '❓', startSecond: 50, endSecond: 60 },
];

const TOTAL_SECONDS = 60;

// ===== TOPIC INPUT SCREEN =====
function TopicInputScreen({ onGenerate }: { onGenerate: (topic: string) => void }) {
  const [topic, setTopic] = useState('');
  const [suggestions] = useState(() => {
    // Shuffle and pick 8
    const shuffled = [...TOPIC_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  });

  const handleSubmit = () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast({ title: 'Digite um topico', description: 'Informe o que voce quer aprender.' });
      return;
    }
    onGenerate(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="text-center pt-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{
            background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)',
            boxShadow: 'var(--ws-shadow-enso)',
          }}
        >
          <Clock className="w-10 h-10" style={{ color: 'var(--ws-accent)' }} />
        </motion.div>
        <h1 className="font-serif-jp text-2xl font-bold mb-2" style={{ color: 'var(--ws-text-primary)' }}>
          Aprenda em 60 segundos
        </h1>
        <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
          Microaula rapida com 5 fases imersivas
        </p>
      </div>

      {/* Phase Preview */}
      <div className="flex items-center gap-1 px-2">
        {PHASE_CONFIG.map((p, i) => (
          <div key={p.phase} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center flex-1">
              <span className="text-sm mb-0.5">{p.emoji}</span>
              <span className="text-[9px] font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
                {p.title}
              </span>
            </div>
            {i < PHASE_CONFIG.length - 1 && (
              <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ws-text-tertiary)', marginTop: '-8px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <Input
          placeholder="Qualquer topico: React, Calculo, Historia, Biologia..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="h-12 pl-4 pr-12 rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus-visible:ring-[var(--ws-accent)]/30 text-base"
        />
        <button
          onClick={handleSubmit}
          disabled={!topic.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full transition-ws"
          style={{
            background: topic.trim() ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
            color: topic.trim() ? 'var(--ws-text-on-dark)' : 'var(--ws-text-tertiary)',
          }}
          aria-label="Gerar microaula"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: 'var(--ws-text-tertiary)' }}>
          Sugestoes rapidas
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setTopic(s); }}
              className="px-3.5 py-2 text-sm font-medium rounded-ws-button transition-ws hover-lift"
              style={{
                background: 'var(--ws-glass)',
                border: '1px solid var(--ws-glass-border)',
                color: 'var(--ws-text-secondary)',
              }}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== LESSON SCREEN =====
function LessonScreen({
  lesson,
  onComplete,
}: {
  lesson: MicroLessonData;
  onComplete: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive current phase from elapsed time
  const currentPhase = (() => {
    if (elapsed >= TOTAL_SECONDS) return PHASE_CONFIG.length - 1;
    const idx = PHASE_CONFIG.findIndex(
      (p) => elapsed >= p.startSecond && elapsed < p.endSecond
    );
    return idx !== -1 ? idx : 0;
  })();

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= TOTAL_SECONDS) {
          if (timerRef.current) clearInterval(timerRef.current);
          return TOTAL_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-complete when timer ends and quiz is done
  useEffect(() => {
    if (elapsed >= TOTAL_SECONDS && (quizSubmitted || !lesson.quizQuestion)) {
      const t = setTimeout(onComplete, 2000);
      return () => clearTimeout(t);
    }
  }, [elapsed, quizSubmitted, onComplete, lesson.quizQuestion]);

  const activePhase = lesson.phases?.[currentPhase] || {
    ...PHASE_CONFIG[currentPhase],
    content: 'Carregando...',
  };

  const progress = (elapsed / TOTAL_SECONDS) * 100;
  const phaseConfig = PHASE_CONFIG[currentPhase];

  // Phase background tint
  const phaseTints = [
    'rgba(217, 56, 56, 0.03)',   // red accent for conceito
    'rgba(217, 119, 6, 0.03)',   // amber for analogia
    'rgba(22, 163, 74, 0.03)',   // green for exemplo
    'rgba(234, 88, 12, 0.03)',   // orange for aplicacao
    'rgba(139, 92, 246, 0.03)',  // violet for pergunta
  ];

  const isQuizPhase = currentPhase === 4 && lesson.quizQuestion;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-5"
    >
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
              {lesson.topic}
            </span>
          </div>
          <span
            className="text-xs font-mono font-bold tabular-nums"
            style={{ color: elapsed <= 10 ? 'var(--ws-accent)' : 'var(--ws-text-secondary)' }}
          >
            {Math.max(0, TOTAL_SECONDS - elapsed)}s
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--ws-glass-border)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 60%, var(--ws-gold)))',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </div>

        {/* Phase indicators */}
        <div className="flex gap-1 mt-2">
          {PHASE_CONFIG.map((p, i) => (
            <div
              key={p.phase}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i < currentPhase
                  ? 'var(--ws-accent)'
                  : i === currentPhase
                    ? 'color-mix(in srgb, var(--ws-accent) 50%, transparent)'
                    : 'var(--ws-glass-border)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Phase Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="glass-enhanced overflow-hidden"
          style={{
            borderRadius: 'var(--ws-radius-card)',
            background: `linear-gradient(135deg, ${phaseTints[currentPhase]}, var(--ws-glass))`,
          }}
        >
          {/* Phase Header */}
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2.5 mb-3">
              <motion.span
                key={`emoji-${currentPhase}`}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-2xl"
              >
                {phaseConfig.emoji}
              </motion.span>
              <div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--ws-accent)' }}
                >
                  Fase {phaseConfig.phase} de 5
                </span>
                <h2 className="font-serif-jp text-lg font-bold" style={{ color: 'var(--ws-text-primary)' }}>
                  {phaseConfig.title}
                </h2>
              </div>
              <span
                className="ml-auto text-[10px] font-mono px-2 py-1 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)',
                  color: 'var(--ws-accent)',
                }}
              >
                {phaseConfig.startSecond}-{phaseConfig.endSecond}s
              </span>
            </div>
          </div>

          {/* Phase Content */}
          <div className="px-5 pb-5">
            {!isQuizPhase ? (
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: 'var(--ws-text-primary)' }}
              >
                {activePhase.content}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-[15px] font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                  {lesson.quizQuestion}
                </p>
                <div className="space-y-2">
                  {lesson.quizOptions?.map((opt, idx) => {
                    const isSelected = quizAnswer === idx;
                    const isSubmitted = quizSubmitted;
                    const isCorrect = lesson.quizCorrectIndex === idx;

                    let bg = 'var(--ws-glass)';
                    let border = 'var(--ws-glass-border)';
                    let color = 'var(--ws-text-primary)';

                    if (isSubmitted) {
                      if (isCorrect) {
                        bg = 'rgba(22, 163, 74, 0.1)';
                        border = 'rgba(22, 163, 74, 0.3)';
                        color = '#16A34A';
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(220, 38, 38, 0.1)';
                        border = 'rgba(220, 38, 38, 0.3)';
                        color = '#DC2626';
                      } else {
                        bg = 'color-mix(in srgb, var(--ws-glass) 50%, transparent)';
                        color = 'var(--ws-text-tertiary)';
                      }
                    } else if (isSelected) {
                      bg = 'color-mix(in srgb, var(--ws-accent) 8%, transparent)';
                      border = 'color-mix(in srgb, var(--ws-accent) 30%, transparent)';
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileTap={!isSubmitted ? { scale: 0.98 } : undefined}
                        onClick={() => {
                          if (!isSubmitted) {
                            setQuizAnswer(idx);
                            setQuizSubmitted(true);
                          }
                        }}
                        disabled={isSubmitted}
                        className="w-full flex items-center gap-3 p-3.5 text-left transition-ws"
                        style={{
                          borderRadius: 'var(--ws-radius-button)',
                          background: bg,
                          border: `1.5px solid ${border}`,
                          color,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: isSubmitted && isCorrect
                              ? 'rgba(22, 163, 74, 0.15)'
                              : isSubmitted && isSelected && !isCorrect
                                ? 'rgba(220, 38, 38, 0.15)'
                                : 'color-mix(in srgb, var(--ws-ink) 6%, transparent)',
                          }}
                        >
                          {isSubmitted && isCorrect ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : isSubmitted && isSelected && !isCorrect ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </div>
                        <span className="text-sm font-medium">{opt}</span>
                      </motion.button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center"
                    style={{
                      color: quizAnswer === lesson.quizCorrectIndex ? '#16A34A' : '#DC2626',
                    }}
                  >
                    {quizAnswer === lesson.quizCorrectIndex
                      ? '🎉 Correto!'
                      : `Resposta correta: ${lesson.quizOptions?.[lesson.quizCorrectIndex ?? 0]}`}
                  </motion.p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ===== RESULT SCREEN =====
function ResultScreen({
  topic,
  understood,
  onUnderstood,
  onNotUnderstood,
  onRetry,
}: {
  topic: string;
  understood: boolean | null;
  onUnderstood: () => void;
  onNotUnderstood: () => void;
  onRetry: () => void;
}) {
  const [simplerExplanation, setSimplerExplanation] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="text-center pt-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="text-5xl mb-4"
        >
          {understood === null ? '🤔' : understood ? '🎉' : '🤔'}
        </motion.div>
        <h2 className="font-serif-jp text-xl font-bold mb-2" style={{ color: 'var(--ws-text-primary)' }}>
          {understood === null
            ? `Voce entendeu ${topic}?`
            : understood
              ? 'Excelente!'
              : 'Tudo bem, vamos tentar de novo.'}
        </h2>
        {understood === null && (
          <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
            Seja honesto - isso ajuda a IA a se adaptar ao seu nivel.
          </p>
        )}
      </div>

      {understood === null && (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onUnderstood}
            className="flex flex-col items-center gap-3 p-6 transition-ws hover-lift"
            style={{
              borderRadius: 'var(--ws-radius-card)',
              background: 'rgba(22, 163, 74, 0.06)',
              border: '1.5px solid rgba(22, 163, 74, 0.2)',
            }}
          >
            <span className="text-4xl">✅</span>
            <span className="text-base font-semibold" style={{ color: '#16A34A' }}>Sim, entendi!</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onNotUnderstood}
            className="flex flex-col items-center gap-3 p-6 transition-ws hover-lift"
            style={{
              borderRadius: 'var(--ws-radius-card)',
              background: 'rgba(220, 38, 38, 0.06)',
              border: '1.5px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            <span className="text-4xl">😅</span>
            <span className="text-base font-semibold" style={{ color: '#DC2626' }}>Nao, ainda nao</span>
          </motion.button>
        </div>
      )}

      {understood === true && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div
            className="glass-enhanced p-5"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--ws-text-secondary)' }}>
              Parabens por completar a microaula sobre <strong style={{ color: 'var(--ws-text-primary)' }}>{topic}</strong>!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-ws-button" style={{
                background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
              }}>
                <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--ws-accent)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--ws-text-primary)' }}>+15 XP</p>
              </div>
              <div className="text-center p-3 rounded-ws-button" style={{
                background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
              }}>
                <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: '#D97706' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--ws-text-primary)' }}>60s</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={onRetry}
              className="w-full h-11 text-sm font-semibold rounded-ws-button"
              style={{
                background: 'var(--ws-accent)',
                color: 'var(--ws-text-on-dark)',
                boxShadow: 'var(--ws-shadow-enso)',
              }}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Proximo conceito
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)] hover:bg-[var(--ws-glass)]"
              onClick={() => toast({ title: 'Flashcards em breve!', description: 'Funcionalidade sera liberada em breve.' })}
            >
              <Brain className="mr-2 h-4 w-4" />
              Gerar flashcards
            </Button>
          </div>
        </motion.div>
      )}

      {understood === false && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {!simplerExplanation ? (
            <div
              className="glass-enhanced p-5"
              style={{ borderRadius: 'var(--ws-radius-card)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                Sem problemas! Vamos tentar de uma forma mais simples.
                Clique abaixo para ver uma explicacao resumida.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-enhanced p-5"
              style={{
                borderRadius: 'var(--ws-radius-card)',
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.05), var(--ws-glass))',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💡</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D97706' }}>
                  Explicacao simplificada
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-primary)' }}>
                Tente rever o conceito em sua propria velocidade.
                Anote as partes que nao ficou claro e pergunte ao Sensei AI!
              </p>
            </motion.div>
          )}

          <div className="space-y-2.5">
            {!simplerExplanation && (
              <Button
                onClick={() => setSimplerExplanation(true)}
                className="w-full h-11 text-sm font-semibold rounded-ws-button"
                style={{
                  background: 'var(--ws-accent)',
                  color: 'var(--ws-text-on-dark)',
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ver explicacao simples
              </Button>
            )}
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full h-11 rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)] hover:bg-[var(--ws-glass)]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
type Screen = 'topic' | 'lesson' | 'result';

export function MicroLessonView() {
  const [screen, setScreen] = useState<Screen>('topic');
  const [topic, setTopic] = useState('');
  const [lesson, setLesson] = useState<MicroLessonData | null>(null);
  const [understood, setUnderstood] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (selectedTopic: string) => {
    setTopic(selectedTopic);
    setGenerating(true);
    try {
      const data = await apiFetch('/api/microlesson', {
        method: 'POST',
        body: JSON.stringify({ topic: selectedTopic }),
      });
      setLesson(data);
      setScreen('lesson');
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({
        title: 'Erro ao gerar microaula',
        description: err.message || 'Tente novamente.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleLessonComplete = useCallback(() => {
    setScreen('result');
    setUnderstood(null);
  }, []);

  const handleRetry = () => {
    setLesson(null);
    setUnderstood(null);
    setScreen('topic');
  };

  return (
    <div className="relative min-h-full pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif-jp text-2xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
          Microaula
        </h1>
        <p className="text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
          Aprenda conceitos em 60 segundos
        </p>
      </div>

      {generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-10 h-10" style={{ color: 'var(--ws-accent)' }} />
          </motion.div>
          <p className="text-sm font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
            Gerando microaula sobre &quot;{topic}&quot;...
          </p>
        </motion.div>
      )}

      {!generating && (
        <AnimatePresence mode="wait">
          {screen === 'topic' && (
            <TopicInputScreen key="topic" onGenerate={handleGenerate} />
          )}
          {screen === 'lesson' && lesson && (
            <LessonScreen key="lesson" lesson={lesson} onComplete={handleLessonComplete} />
          )}
          {screen === 'result' && (
            <ResultScreen
              key="result"
              topic={topic}
              understood={understood}
              onUnderstood={() => setUnderstood(true)}
              onNotUnderstood={() => setUnderstood(false)}
              onRetry={handleRetry}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default MicroLessonView;
