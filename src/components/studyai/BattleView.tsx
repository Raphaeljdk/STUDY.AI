'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, RotateCcw,
  ChevronRight, Loader2, Zap, Target,
  Flame, History, Check, X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ===== TYPES =====
interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface BattleState {
  id: string;
  subject: string;
  questions: BattleQuestion[];
  startedAt: string;
}

interface BattleResult {
  id: string;
  score: number;
  total: number;
  xpEarned: number;
  accuracy: number;
  avgConfidence: number;
  subject: string;
  completedAt: string;
}

interface BattleHistoryItem {
  id: string;
  subject: string;
  score: number;
  total: number;
  xpEarned: number;
  accuracy: number;
  avgConfidence: number;
  completedAt: string;
}

// ===== SUBJECTS =====
const POPULAR_SUBJECTS = [
  { name: 'Java', emoji: '☕' },
  { name: 'Matematica', emoji: '📐' },
  { name: 'Historia', emoji: '📜' },
  { name: 'Quimica', emoji: '⚗️' },
  { name: 'Ingles', emoji: '🇬🇧' },
  { name: 'Engenharia de Software', emoji: '⚙️' },
  { name: 'Fisica', emoji: '⚛️' },
  { name: 'Portugues', emoji: '📖' },
  { name: 'Biologia', emoji: '🧬' },
  { name: 'Geografia', emoji: '🌍' },
];

const CONFIDENCE_LEVELS = [
  { emoji: '😰', label: 'Chutei', value: 1 },
  { emoji: '😐', label: 'Pouco confiante', value: 2 },
  { emoji: '🙂', label: 'Confiante', value: 3 },
  { emoji: '🔥', label: 'Muito confiante', value: 4 },
];

const TIMER_DURATION = 12;

// ===== CIRCULAR TIMER =====
function CircularTimer({ seconds, maxSeconds }: { seconds: number; maxSeconds: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / maxSeconds;
  const offset = circumference * (1 - progress);
  const isLow = seconds <= 4;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--ws-glass-border)"
          strokeWidth="5"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={isLow ? '#DC2626' : 'var(--ws-accent)'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{
            color: isLow ? '#DC2626' : 'var(--ws-text-primary)',
          }}
        >
          {seconds}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>
          seg
        </span>
      </div>
    </div>
  );
}

// ===== PROGRESS DOTS =====
function ProgressDots({ current, total, answers }: { current: number; total: number; answers: (boolean | null)[] }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => {
        const answered = answers[i];
        let bgColor = 'var(--ws-glass-border)';
        if (answered === true) bgColor = '#16A34A';
        else if (answered === false) bgColor = '#DC2626';
        const isCurrent = i === current;

        return (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            animate={{
              scale: isCurrent ? 1.4 : 1,
            }}
            style={{
              backgroundColor: isCurrent ? 'var(--ws-accent)' : bgColor,
              boxShadow: isCurrent ? '0 0 12px color-mix(in srgb, var(--ws-accent) 40%, transparent)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ===== SUBJECT SELECTION =====
function SubjectSelection({ onStart }: { onStart: (subject: string) => Promise<void> }) {
  const [customSubject, setCustomSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    const subject = selectedSubject || customSubject.trim();
    if (!subject) {
      toast({ title: 'Selecione um assunto', description: 'Escolha um assunto para o duelo.' });
      return;
    }
    setLoading(true);
    try {
      await onStart(subject);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
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
          <Swords className="w-10 h-10" style={{ color: 'var(--ws-accent)' }} />
        </motion.div>
        <h1 className="font-serif-jp text-2xl font-bold mb-2" style={{ color: 'var(--ws-text-primary)' }}>
          Duelo de Conhecimento
        </h1>
        <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
          5 questoes · 12 segundos cada · Gane XP
        </p>
      </div>

      {/* Subject Grid */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--ws-text-tertiary)' }}>
          Escolha o assunto
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {POPULAR_SUBJECTS.map((subj) => {
            const isSelected = selectedSubject === subj.name;
            return (
              <motion.button
                key={subj.name}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedSubject(isSelected ? null : subj.name);
                  setCustomSubject('');
                }}
                className="flex items-center gap-2.5 p-3.5 text-left transition-ws"
                style={{
                  borderRadius: 'var(--ws-radius-card)',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--ws-accent) 10%, var(--ws-glass))'
                    : 'var(--ws-glass)',
                  border: `1px solid ${isSelected
                    ? 'color-mix(in srgb, var(--ws-accent) 30%, transparent)'
                    : 'var(--ws-glass-border)'}`,
                  boxShadow: isSelected ? '0 4px 20px color-mix(in srgb, var(--ws-accent) 10%, transparent)' : 'var(--ws-shadow-soft)',
                }}
              >
                <span className="text-lg flex-shrink-0">{subj.emoji}</span>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: isSelected ? 'var(--ws-accent)' : 'var(--ws-text-primary)' }}
                >
                  {subj.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom input */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--ws-text-tertiary)' }}>
          Ou digite um assunto
        </p>
        <Input
          placeholder="Ex: React, Calculo, Literatura..."
          value={customSubject}
          onChange={(e) => {
            setCustomSubject(e.target.value);
            setSelectedSubject(null);
          }}
          className="h-11 rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)] text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus-visible:ring-[var(--ws-accent)]/30"
        />
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={loading || (!selectedSubject && !customSubject.trim())}
        className="w-full h-12 text-base font-semibold rounded-ws-button transition-ws"
        style={{
          background: 'var(--ws-accent)',
          color: 'var(--ws-text-on-dark)',
          boxShadow: 'var(--ws-shadow-enso)',
        }}
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Zap className="mr-2 h-5 w-5" />
        )}
        Iniciar Duelo
      </Button>
    </motion.div>
  );
}

// ===== BATTLE SCREEN =====
function BattleScreen({
  battle,
  onFinish,
}: {
  battle: BattleState;
  onFinish: (answers: { questionId: string; selectedIndex: number; confidence: number; correct: boolean }[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showConfidence, setShowConfidence] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    Array(battle.questions.length).fill(null)
  );
  const [answeredOptions, setAnsweredOptions] = useState<Record<number, number>>({});
  const [results, setResults] = useState<
    { questionId: string; selectedIndex: number; confidence: number; correct: boolean }[]
  >([]);
  const [showResult, setShowResult] = useState(false);
  const [correctFlash, setCorrectFlash] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = battle.questions[currentIndex];

  const handleTimeout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAnsweredOptions((prev) => ({ ...prev, [currentIndex]: -1 }));
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = false;
      return next;
    });
    setCorrectFlash(false);
    setTimeout(() => {
      setCorrectFlash(null);
      setShowConfidence(true);
    }, 600);
  }, [currentIndex]);

  // Timer tick
  useEffect(() => {
    if (showConfidence || showResult) return;
    timerRef.current = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, showConfidence, showResult]);

  // Handle timeout when timer reaches 0
  useEffect(() => {
    if (timer === 0 && !showConfidence && !showResult) {
      const id = setTimeout(() => {
        handleTimeout();
      }, 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [timer, showConfidence, showResult, handleTimeout]);

  const handleSelectOption = (optionIndex: number) => {
    if (selectedOption !== null || showConfidence) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setSelectedOption(optionIndex);
    setAnsweredOptions((prev) => ({ ...prev, [currentIndex]: optionIndex }));
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = isCorrect;
      return next;
    });
    setCorrectFlash(isCorrect);

    setTimeout(() => {
      setCorrectFlash(null);
      setShowConfidence(true);
    }, 600);
  };

  const handleConfidence = (confidence: number) => {
    const optionIdx = selectedOption ?? -1;
    const isCorrect = optionIdx === currentQuestion.correctIndex;

    setResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedIndex: optionIdx,
        confidence,
        correct: isCorrect,
      },
    ]);

    setShowConfidence(false);
    setSelectedOption(null);

    if (currentIndex < battle.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimer(TIMER_DURATION);
    } else {
      setShowResult(true);
    }
  };

  // Compute result and submit
  useEffect(() => {
    if (showResult && results.length === battle.questions.length) {
      const timer = setTimeout(() => onFinish(results), 500);
      return () => clearTimeout(timer);
    }
  }, [showResult, results, battle.questions.length, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-5"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
            {battle.subject}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
            background: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)',
            color: 'var(--ws-accent)',
          }}>
            {currentIndex + 1}/{battle.questions.length}
          </span>
        </div>
      </div>

      {/* Timer & Progress */}
      <div className="flex flex-col items-center gap-4">
        <CircularTimer seconds={timer} maxSeconds={TIMER_DURATION} />
        <ProgressDots
          current={currentIndex}
          total={battle.questions.length}
          answers={answers}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Flash overlay */}
          {correctFlash !== null && (
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="fixed inset-0 z-50 pointer-events-none"
              style={{
                backgroundColor: correctFlash ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
              }}
            />
          )}

          <div
            className="glass-enhanced p-5"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <h2
              className="font-serif-jp text-lg font-semibold leading-relaxed"
              style={{ color: 'var(--ws-text-primary)' }}
            >
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const answeredIdx = answeredOptions[currentIndex];
              const isAnswered = answeredIdx !== undefined;
              const isSelected = answeredIdx === idx;
              const isCorrectAnswer = idx === currentQuestion.correctIndex;

              let optionBg = 'var(--ws-glass)';
              let optionBorder = 'var(--ws-glass-border)';
              let optionColor = 'var(--ws-text-primary)';

              if (isAnswered) {
                if (isCorrectAnswer) {
                  optionBg = 'rgba(22, 163, 74, 0.1)';
                  optionBorder = 'rgba(22, 163, 74, 0.3)';
                  optionColor = '#16A34A';
                } else if (isSelected && !isCorrectAnswer) {
                  optionBg = 'rgba(220, 38, 38, 0.1)';
                  optionBorder = 'rgba(220, 38, 38, 0.3)';
                  optionColor = '#DC2626';
                } else {
                  optionBg = 'color-mix(in srgb, var(--ws-glass) 50%, transparent)';
                  optionBorder = 'var(--ws-glass-border)';
                  optionColor = 'var(--ws-text-tertiary)';
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered || showConfidence}
                  className="w-full flex items-center gap-3 p-4 text-left transition-ws"
                  style={{
                    borderRadius: 'var(--ws-radius-button)',
                    background: optionBg,
                    border: `1.5px solid ${optionBorder}`,
                    color: optionColor,
                    opacity: isAnswered && !isCorrectAnswer && !isSelected ? 0.5 : 1,
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: isAnswered && isCorrectAnswer
                        ? 'rgba(22, 163, 74, 0.15)'
                        : isAnswered && isSelected && !isCorrectAnswer
                          ? 'rgba(220, 38, 38, 0.15)'
                          : 'color-mix(in srgb, var(--ws-ink) 6%, transparent)',
                    }}
                  >
                    {isAnswered && isCorrectAnswer ? (
                      <Check className="w-4 h-4" />
                    ) : isAnswered && isSelected && !isCorrectAnswer ? (
                      <X className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </div>
                  <span className="text-sm font-medium leading-snug">
                    {option}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Confidence Selector */}
      <AnimatePresence>
        {showConfidence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-3 pt-2"
          >
            <p className="text-center text-sm font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
              Quao confiante voce esta?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {CONFIDENCE_LEVELS.map((level) => (
                <motion.button
                  key={level.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleConfidence(level.value)}
                  className="flex flex-col items-center gap-1.5 p-3 transition-ws hover-lift"
                  style={{
                    borderRadius: 'var(--ws-radius-button)',
                    background: 'var(--ws-glass)',
                    border: '1px solid var(--ws-glass-border)',
                  }}
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--ws-text-secondary)' }}>
                    {level.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== RESULTS SCREEN =====
function ResultsScreen({
  result,
  history,
  onPlayAgain,
  onBack,
}: {
  result: BattleResult;
  history: BattleHistoryItem[];
  onPlayAgain: () => void;
  onBack: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const getScoreEmoji = () => {
    const pct = result.accuracy;
    if (pct >= 100) return '🏆';
    if (pct >= 80) return '🎯';
    if (pct >= 60) return '💪';
    if (pct >= 40) return '📚';
    return '🔄';
  };

  const getScoreMessage = () => {
    const pct = result.accuracy;
    if (pct >= 100) return 'Perfeito! Conhecimento absoluto!';
    if (pct >= 80) return 'Excelente! Quase la!';
    if (pct >= 60) return 'Bom trabalho! Continue assim!';
    if (pct >= 40) return 'Ta no caminho. Revise e tente de novo!';
    return 'Nao desista! A pratica faz a perfeicao.';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      {/* Score Hero */}
      <div className="text-center pt-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="text-6xl mb-4"
        >
          {getScoreEmoji()}
        </motion.div>
        <h2 className="font-serif-jp text-2xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
          {result.score}/{result.total}
        </h2>
        <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
          {getScoreMessage()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-enhanced p-4 text-center"
          style={{ borderRadius: 'var(--ws-radius-card)' }}
        >
          <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--ws-accent)' }} />
          <p className="text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
            +{result.xpEarned}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>XP Ganho</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-enhanced p-4 text-center"
          style={{ borderRadius: 'var(--ws-radius-card)' }}
        >
          <Target className="w-5 h-5 mx-auto mb-1" style={{ color: '#D97706' }} />
          <p className="text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
            {result.accuracy}%
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>Precisao</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-enhanced p-4 text-center"
          style={{ borderRadius: 'var(--ws-radius-card)' }}
        >
          <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: '#EA580C' }} />
          <p className="text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
            {result.avgConfidence > 0 ? (result.avgConfidence / 4 * 100).toFixed(0) + '%' : '--'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>Confianca Media</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-enhanced p-4 text-center"
          style={{ borderRadius: 'var(--ws-radius-card)' }}
        >
          <Swords className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--ws-accent)' }} />
          <p className="text-sm font-bold truncate px-1" style={{ color: 'var(--ws-text-primary)' }}>
            {result.subject}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>Assunto</p>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <Button
          onClick={onPlayAgain}
          className="w-full h-12 text-base font-semibold rounded-ws-button transition-ws"
          style={{
            background: 'var(--ws-accent)',
            color: 'var(--ws-text-on-dark)',
            boxShadow: 'var(--ws-shadow-enso)',
          }}
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Desafiar novamente
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full h-11 rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)] hover:bg-[var(--ws-glass)]"
        >
          Voltar ao inicio
        </Button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 mx-auto text-sm font-medium transition-ws"
            style={{ color: 'var(--ws-text-tertiary)' }}
          >
            <History className="w-4 h-4" />
            Historico de duelos ({history.length})
            <ChevronRight
              className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                  {history.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3"
                      style={{
                        borderRadius: 'var(--ws-radius-button)',
                        background: 'var(--ws-glass)',
                        border: '1px solid var(--ws-glass-border)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: item.accuracy >= 80
                            ? 'rgba(22, 163, 74, 0.1)'
                            : item.accuracy >= 50
                              ? 'rgba(217, 119, 6, 0.1)'
                              : 'rgba(220, 38, 38, 0.1)',
                          color: item.accuracy >= 80
                            ? '#16A34A'
                            : item.accuracy >= 50
                              ? '#D97706'
                              : '#DC2626',
                        }}
                      >
                        {item.score}/{item.total}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ws-text-primary)' }}>
                          {item.subject}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                          +{item.xpEarned} XP · {item.accuracy}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
type Screen = 'subject' | 'battle' | 'results';

export function BattleView() {
  const [screen, setScreen] = useState<Screen>('subject');
  const [subject, setSubject] = useState('');
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/battle');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.battles || data || []);
        }
      } catch {
        // silent
      }
    };
    fetchHistory();
  }, []);

  const handleStartBattle = async (selectedSubject: string) => {
    setSubject(selectedSubject);
    setLoading(true);
    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start battle');
      }
      const data = await res.json();
      setBattle(data);
      setScreen('battle');
    } catch (err: any) {
      toast({
        title: 'Erro ao iniciar duelo',
        description: err.message || 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinishBattle = async (
    answers: { questionId: string; selectedIndex: number; confidence: number; correct: boolean }[]
  ) => {
    if (!battle) return;
    try {
      const res = await fetch('/api/battle/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: battle.id,
          answers,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        // Refresh history
        const histRes = await fetch('/api/battle');
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.battles || histData || []);
        }
      }
    } catch {
      toast({ title: 'Erro ao salvar resultado', description: 'Seu resultado foi calculado localmente.' });
      // If API fails, compute locally
      const score = answers.filter((a) => a.correct).length;
      const localResult: BattleResult = {
        id: battle.id,
        subject,
        score,
        total: battle.questions.length,
        xpEarned: score * 20,
        accuracy: Math.round((score / battle.questions.length) * 100),
        avgConfidence:
          answers.length > 0
            ? Math.round(answers.reduce((sum, a) => sum + a.confidence, 0) / answers.length * 10) / 10
            : 0,
        completedAt: new Date().toISOString(),
      };
      setResult(localResult);
    }
    setScreen('results');
  };

  const handlePlayAgain = () => {
    setBattle(null);
    setResult(null);
    setScreen('subject');
  };

  const handleBackToStart = () => {
    setBattle(null);
    setResult(null);
    setSubject('');
    setScreen('subject');
  };

  return (
    <div className="relative min-h-full pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif-jp text-2xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
          Duelo de Conhecimento
        </h1>
        <p className="text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
          Teste seus conhecimentos em 1 minuto
        </p>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'subject' && (
          <SubjectSelection key="subject" onStart={handleStartBattle} />
        )}
        {screen === 'battle' && battle && (
          <BattleScreen key="battle" battle={battle} onFinish={handleFinishBattle} />
        )}
        {screen === 'results' && result && (
          <ResultsScreen
            key="results"
            result={result}
            history={history}
            onPlayAgain={handlePlayAgain}
            onBack={handleBackToStart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
