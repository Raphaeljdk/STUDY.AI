// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Brain, Sparkles, Loader2, BookOpen,
  ChevronRight, ArrowRight, RotateCcw, Check, X,
  Zap, Target, TrendingUp, Award, Clock, Star,
  Lightbulb, AlertCircle, CheckCircle2, HelpCircle,
  MessageSquare, History, PenLine, BarChart3, Shield,
  ArrowLeft, Flame, Eye, BookMarked, ChevronDown,
  ListChecks, FileText, Wrench, Compass, Notebook,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WabiSabiCard } from './WabiSabiCard';
import { Progress } from '@/components/ui/progress';

// ===== TYPES =====
interface TeachViewProps {
  onNavigate: (tab: string) => void;
}

interface AnalysisResult {
  mastery: number;
  precision: number;
  depth: number;
  clarity: number;
  completeness: number;
  overallGrade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  corrections: string[];
  suggestions: string[];
  questionsToExplore: string[];
  nextTopics: string[];
  encouragement: string;
  improvementSteps?: string[];
  relatedTopicsToStudy?: string[];
}

interface StudyGuide {
  outline: string[];
  keyConcepts: string[];
  practiceQuestions: string[];
  commonMistakes: string[];
  resources: string[];
}

interface TeachingHistory {
  topic: string;
  subject: string | null;
  difficulty: string;
  mastery: number;
  grade: string;
  xpEarned: number;
  date: string;
}

interface SubjectOption {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ===== CONSTANTS =====
const DIFFICULTY_LEVELS = [
  { value: 'basico', label: 'Basico', emoji: '🌱', description: 'Conceitos fundamentais' },
  { value: 'intermediario', label: 'Intermediario', emoji: '🌿', description: 'Alem do basico' },
  { value: 'avancado', label: 'Avancado', emoji: '🌳', description: 'Detalhado e profundo' },
];

const TOPIC_SUGGESTIONS = [
  { topic: 'Polimorfismo', emoji: '🧬', subject: 'Java' },
  { topic: 'API REST', emoji: '🌐', subject: 'Engenharia de Software' },
  { topic: 'Funcoes', emoji: '📐', subject: 'Matematica' },
  { topic: 'Heranca', emoji: '👨‍👩‍👧', subject: 'POO' },
  { topic: 'Normalizacao', emoji: '🗃️', subject: 'Banco de Dados' },
  { topic: 'Recursao', emoji: '🔄', subject: 'Algoritmos' },
  { topic: 'JWT', emoji: '🔐', subject: 'Seguranca' },
  { topic: 'Docker', emoji: '🐳', subject: 'DevOps' },
  { topic: 'Reatividade', emoji: '⚡', subject: 'React' },
  { topic: 'Sorting', emoji: '📊', subject: 'Algoritmos' },
  { topic: 'HTTP', emoji: '📡', subject: 'Redes' },
  { topic: 'SQL Joins', emoji: '🔗', subject: 'SQL' },
];

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

const GRADE_LABELS: Record<string, string> = {
  A: 'Excelente',
  B: 'Bom',
  C: 'Regular',
  D: 'Precisa melhorar',
  F: 'Rever conceito',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ===== SCORE RING =====
function ScoreRing({ value, size = 80, strokeWidth = 6, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, 100) / 100;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ws-glass-border)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{Math.round(value)}</span>
    </div>
  );
}

// ===== METER BAR =====
function MeterBar({ label, value, icon: Icon, color, delay = 0 }: { label: string; value: number; icon: React.ElementType; color: string; delay?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          {label}
        </span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <motion.div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--ws-glass-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, delay: delay * 0.15, ease: 'easeOut' }}
        />
      </motion.div>
    </div>
  );
}

// ===== FEEDBACK LIST =====
function FeedbackList({ items, icon: Icon, color, title }: { items: string[]; icon: React.ElementType; color: string; title: string }) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <Icon className="w-4 h-4" />
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <motion.li
            key={i}
            variants={itemVariants}
            className="flex items-start gap-2 text-sm pl-1"
            style={{ color: 'var(--ws-text-secondary)' }}
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ===== XP CELEBRATION =====
function XPCelebration({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -10, scale: 1 }}
      exit={{ opacity: 0, y: -60 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full"
      style={{
        background: 'color-mix(in srgb, var(--ws-gold) 20%, var(--ws-glass))',
        backdropFilter: 'blur(12px)',
        border: '1px solid color-mix(in srgb, var(--ws-gold) 30%, transparent)',
        boxShadow: '0 8px 32px rgba(184, 160, 136, 0.2)',
      }}
    >
      <Sparkles className="w-4 h-4" style={{ color: 'var(--ws-gold)' }} />
      <span className="font-bold text-sm" style={{ color: 'var(--ws-gold)' }}>+{xp} XP</span>
    </motion.div>
  );
}

// ===== STUDY GUIDE CARD =====
function StudyGuideCard({ guide, onClose }: { guide: StudyGuide; onClose: () => void }) {
  const [openSection, setOpenSection] = useState<string | null>('outline');

  const sections = [
    { key: 'outline', label: 'Roteiro de estudo', icon: ListChecks, color: 'var(--ws-accent)', items: guide.outline },
    { key: 'keyConcepts', label: 'Conceitos-chave', icon: Brain, color: 'var(--ws-verdigris)', items: guide.keyConcepts },
    { key: 'practiceQuestions', label: 'Perguntas para praticar', icon: HelpCircle, color: 'var(--ws-gold)', items: guide.practiceQuestions },
    { key: 'commonMistakes', label: 'Erros comuns', icon: AlertCircle, color: 'var(--ws-accent)', items: guide.commonMistakes },
    { key: 'resources', label: 'Dicas de estudo', icon: Lightbulb, color: 'var(--ws-gold)', items: guide.resources },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl p-4 space-y-3"
        style={{
          background: 'color-mix(in srgb, var(--ws-accent) 5%, var(--ws-glass))',
          border: '1px solid color-mix(in srgb, var(--ws-accent) 15%, transparent)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Guia de Estudo</p>
              <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>Preparacao para Tecnica de Feynman</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--ws-glass-border)' }}
          >
            <X className="w-3 h-3" style={{ color: 'var(--ws-text-tertiary)' }} />
          </motion.button>
        </div>

        <div className="space-y-1.5">
          {sections.map((section) => {
            const isOpen = openSection === section.key;
            const SectionIcon = section.icon;
            return (
              <div key={section.key}>
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.key)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all"
                  style={{
                    background: isOpen ? 'color-mix(in srgb, var(--ws-glass) 80%, transparent)' : 'transparent',
                  }}
                >
                  <span className="flex items-center gap-2 text-xs font-medium" style={{ color: section.color }}>
                    <SectionIcon className="w-3.5 h-3.5" />
                    {section.label}
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'color-mix(in srgb, var(--ws-glass-border) 50%, transparent)', color: 'var(--ws-text-tertiary)' }}>
                      {section.items?.length || 0}
                    </span>
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--ws-text-tertiary)' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && section.items && section.items.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-2 space-y-1.5">
                        {section.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs pl-1" style={{ color: 'var(--ws-text-secondary)' }}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: section.color }} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ===== TOPIC SELECTION SCREEN =====
function TopicScreen({ subjects, onSelect }: { subjects: SubjectOption[]; onSelect: (topic: string, subject?: string) => void }) {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('intermediario');
  const [phase, setPhase] = useState<'subject' | 'topic' | 'custom'>('subject');

  const filteredSubjects = selectedSubject
    ? subjects.filter(s => s.name === selectedSubject)
    : subjects;

  const handleSubmitCustom = () => {
    const trimmed = customTopic.trim();
    if (trimmed.length < 2) {
      toast({ title: 'Topico muito curto', description: 'Digite pelo menos 2 caracteres.' });
      return;
    }
    onSelect(trimmed, subjects.find(s => s.name === selectedSubject)?.name);
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial" animate="animate" exit="exit"
      className="space-y-6"
    >
      {/* Hero */}
      <div className="text-center pt-2">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{
            background: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)',
            boxShadow: '0 0 80px color-mix(in srgb, var(--ws-verdigris) 15%, transparent)',
          }}
        >
          <GraduationCap className="w-10 h-10" style={{ color: 'var(--ws-verdigris)' }} />
        </motion.div>
        <h1 className="font-serif-jp text-2xl font-bold mb-2" style={{ color: 'var(--ws-text-primary)' }}>
          Ensinar para a IA
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--ws-text-secondary)' }}>
          Explique um conceito como se voce fosse o professor. A IA vai avaliar sua precisao, profundidade e clareza.
        </p>
      </div>

      {/* Difficulty Selector */}
      <div className="px-1">
        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Nivel de dificuldade
        </p>
        <div className="flex gap-2">
          {DIFFICULTY_LEVELS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className="flex-1 rounded-xl px-3 py-2.5 text-center transition-all duration-200 border"
              style={{
                background: difficulty === d.value
                  ? 'color-mix(in srgb, var(--ws-accent) 10%, var(--ws-glass))'
                  : 'var(--ws-glass)',
                borderColor: difficulty === d.value
                  ? 'color-mix(in srgb, var(--ws-accent) 30%, transparent)'
                  : 'var(--ws-glass-border)',
              }}
            >
              <span className="text-lg">{d.emoji}</span>
              <p className="text-xs font-medium mt-0.5" style={{
                color: difficulty === d.value ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
              }}>
                {d.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--ws-glass-border)' }}>
        <button
          onClick={() => setPhase('subject')}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all"
          style={{
            background: phase === 'subject' ? 'var(--ws-glass)' : 'transparent',
            color: phase === 'subject' ? 'var(--ws-text-primary)' : 'var(--ws-text-tertiary)',
            boxShadow: phase === 'subject' ? 'var(--ws-shadow-soft)' : 'none',
          }}
        >
          Por materia
        </button>
        <button
          onClick={() => setPhase('topic')}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all"
          style={{
            background: phase === 'topic' ? 'var(--ws-glass)' : 'transparent',
            color: phase === 'topic' ? 'var(--ws-text-primary)' : 'var(--ws-text-tertiary)',
            boxShadow: phase === 'topic' ? 'var(--ws-shadow-soft)' : 'none',
          }}
        >
          Topicos populares
        </button>
        <button
          onClick={() => setPhase('custom')}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all"
          style={{
            background: phase === 'custom' ? 'var(--ws-glass)' : 'transparent',
            color: phase === 'custom' ? 'var(--ws-text-primary)' : 'var(--ws-text-tertiary)',
            boxShadow: phase === 'custom' ? 'var(--ws-shadow-soft)' : 'none',
          }}
        >
          Personalizado
        </button>
      </div>

      {/* Subject Selection */}
      <AnimatePresence mode="wait">
        {phase === 'subject' && subjects.length > 0 && (
          <motion.div key="subject" variants={fadeInUp} initial="initial" animate="animate" exit="exit" className="space-y-3">
            {subjects.map((s) => (
              <motion.button
                key={s.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(s.name, s.name)}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border"
                style={{
                  background: 'var(--ws-glass)',
                  borderColor: 'var(--ws-glass-border)',
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: `${s.color}20` }}>
                  {s.icon === 'book' ? '📖' : s.icon === 'code' ? '💻' : s.icon === 'flask' ? '⚗️' : s.icon === 'calculator' ? '📐' : s.icon === 'globe' ? '🌍' : s.icon === 'music' ? '🎵' : s.icon === 'palette' ? '🎨' : s.icon === 'microscope' ? '🔬' : s.icon === 'scale' ? '⚖️' : s.icon === 'landmark' ? '🏛️' : s.icon === 'graduation' ? '🎓' : s.icon === 'beaker' ? '🧪' : '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--ws-text-primary)' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Clique para ensinar</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--ws-text-tertiary)' }} />
              </motion.button>
            ))}
          </motion.div>
        )}

        {phase === 'topic' && (
          <motion.div key="topic" variants={fadeInUp} initial="initial" animate="animate" exit="exit" className="space-y-3">
            {/* Subject Filter */}
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: !selectedSubject ? 'color-mix(in srgb, var(--ws-accent) 12%, var(--ws-glass))' : 'var(--ws-glass)',
                    color: !selectedSubject ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)',
                    border: `1px solid ${!selectedSubject ? 'color-mix(in srgb, var(--ws-accent) 25%, transparent)' : 'var(--ws-glass-border)'}`,
                  }}
                >
                  Todos
                </button>
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(s.name)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selectedSubject === s.name ? `${s.color}15` : 'var(--ws-glass)',
                      color: selectedSubject === s.name ? s.color : 'var(--ws-text-tertiary)',
                      border: `1px solid ${selectedSubject === s.name ? `${s.color}30` : 'var(--ws-glass-border)'}`,
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {TOPIC_SUGGESTIONS
                .filter(t => !selectedSubject || t.subject === selectedSubject)
                .map((t) => (
                  <motion.button
                    key={t.topic}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(t.topic, t.subject)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition-all border"
                    style={{
                      background: 'var(--ws-glass)',
                      borderColor: 'var(--ws-glass-border)',
                    }}
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--ws-text-primary)' }}>{t.topic}</p>
                      <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>{t.subject}</p>
                    </div>
                  </motion.button>
                ))}
            </div>
          </motion.div>
        )}

        {phase === 'custom' && (
          <motion.div key="custom" variants={fadeInUp} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Qual topico voce quer ensinar?"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitCustom()}
                className="rounded-xl px-4 py-3 text-sm h-12"
                style={{
                  background: 'var(--ws-glass)',
                  borderColor: 'var(--ws-glass-border)',
                }}
              />
              {customTopic.trim().length >= 2 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleSubmitCustom}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--ws-accent)' }}
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </div>

            {/* Quick suggestions for custom */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--ws-text-tertiary)' }}>Sugestoes rapidas</p>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_SUGGESTIONS.slice(0, 6).map((t) => (
                  <button
                    key={t.topic}
                    onClick={() => { setCustomTopic(t.topic); setSelectedSubject(t.subject); }}
                    className="px-3 py-1.5 rounded-full text-xs transition-all border"
                    style={{
                      background: customTopic === t.topic ? 'color-mix(in srgb, var(--ws-verdigris) 10%, var(--ws-glass))' : 'var(--ws-glass)',
                      color: customTopic === t.topic ? 'var(--ws-verdigris)' : 'var(--ws-text-secondary)',
                      borderColor: customTopic === t.topic ? 'color-mix(in srgb, var(--ws-verdigris) 25%, transparent)' : 'var(--ws-glass-border)',
                    }}
                  >
                    {t.emoji} {t.topic}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty subjects state */}
      {phase === 'subject' && subjects.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-8" style={{ color: 'var(--ws-text-tertiary)' }}>
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma materia cadastrada.</p>
          <button
            onClick={() => setPhase('custom')}
            className="mt-2 text-xs font-medium underline" style={{ color: 'var(--ws-accent)' }}
          >
            Digitar topico manualmente
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== EXPLANATION SCREEN =====
function ExplainScreen({ topic, subject, difficulty, onBack, onSubmit }: {
  topic: string; subject?: string; difficulty: string; onBack: () => void; onSubmit: (explanation: string) => void;
}) {
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [notebookCount, setNotebookCount] = useState(0);
  const [notebookNames, setNotebookNames] = useState<string[]>([]);

  const charCount = explanation.length;
  const minChars = 30;
  const isValid = charCount >= minChars;

  // Fetch notebook count for this subject/topic
  useEffect(() => {
    async function fetchNotebookCount() {
      if (!subject && !topic) return;
      try {
        const params = new URLSearchParams();
        if (subject) params.set('subject', subject);
        if (topic) params.set('topic', topic);
        const data = await apiFetch(`/api/teach/notebook-count?${params.toString()}`);
        setNotebookCount(data.count || 0);
        setNotebookNames(data.notebookNames || []);
      } catch {
        // silent
      }
    }
    fetchNotebookCount();
  }, [subject, topic]);

  const handleGenerateGuide = async () => {
    setLoadingGuide(true);
    try {
      const data = await apiFetch('/api/teach/guide', {
        method: 'POST',
        body: JSON.stringify({ topic, subject, difficulty }),
      });
      if (data.guide) {
        setGuide(data.guide);
        toast({ title: 'Guia gerado!', description: 'Use o guia para se preparar antes de explicar.' });
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro ao gerar guia', description: err instanceof Error ? err.message : 'Tente novamente.' });
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleSubmit = () => {
    if (!isValid) {
      toast({ title: 'Explicacao muito curta', description: `Minimo de ${minChars} caracteres.` });
      return;
    }
    setSubmitting(true);
    onSubmit(explanation);
  };

  const tips = [
    'Defina o conceito com suas proprias palavras',
    'Use exemplos praticos para ilustrar',
    'Mencione casos de uso reais',
    'Compare com conceitos similares',
    'Explique por que isso importa',
  ];

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial" animate="animate" exit="exit"
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--ws-text-secondary)' }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif-jp text-lg font-bold truncate" style={{ color: 'var(--ws-text-primary)' }}>
            Ensinar: {topic}
          </h2>
          <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
            {subject && `${subject} · `}{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </p>
        </div>
        <Badge className="rounded-full px-2.5 py-0.5 text-xs"
          style={{ background: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)', color: 'var(--ws-verdigris)' }}>
          <PenLine className="w-3 h-3 mr-1" />
          Escrevendo
        </Badge>
      </div>

      {/* Notebook Notes Indicator */}
      <AnimatePresence>
        {notebookCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: 'color-mix(in srgb, var(--ws-gold) 8%, var(--ws-glass))',
              border: '1px solid color-mix(in srgb, var(--ws-gold) 18%, transparent)',
            }}
          >
            <BookMarked className="w-4 h-4" style={{ color: 'var(--ws-gold)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ws-gold)' }}>
              📚 {notebookCount} {notebookCount === 1 ? 'nota encontrada' : 'notas encontradas'} nos seus cadernos
              {notebookNames.length > 0 && (
                <span style={{ color: 'var(--ws-text-tertiary)' }}> — {notebookNames.slice(0, 2).join(', ')}{notebookNames.length > 2 ? '...' : ''}</span>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Study Guide Button */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={handleGenerateGuide}
        disabled={loadingGuide || !!guide}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
        style={{
          background: guide
            ? 'color-mix(in srgb, var(--ws-verdigris) 8%, var(--ws-glass))'
            : 'var(--ws-glass)',
          border: `1px solid ${guide
            ? 'color-mix(in srgb, var(--ws-verdigris) 20%, transparent)'
            : 'var(--ws-glass-border)'}`,
          color: guide ? 'var(--ws-verdigris)' : 'var(--ws-text-secondary)',
        }}
      >
        {loadingGuide ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Gerando guia de estudo...
          </>
        ) : guide ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Guia de estudo gerado (veja abaixo)
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Gerar Guia de Estudo
          </>
        )}
      </motion.button>

      {/* Study Guide Card (collapsible) */}
      <AnimatePresence>
        {guide && (
          <StudyGuideCard guide={guide} onClose={() => setGuide(null)} />
        )}
      </AnimatePresence>

      {/* Prompt */}
      <div className="rounded-xl p-4" style={{
        background: 'color-mix(in srgb, var(--ws-accent) 6%, var(--ws-glass))',
        border: '1px solid color-mix(in srgb, var(--ws-accent) 15%, transparent)',
      }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' }}>
            <Brain className="w-5 h-5" style={{ color: 'var(--ws-accent)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>
              Agora me explique &quot;{topic}&quot;
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ws-text-tertiary)' }}>
              Imagine que voce e o professor e eu sou o aluno. Seja o mais completo e claro possivel.
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Dicas para uma boa explicacao
        </p>
        <div className="space-y-1">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              <Lightbulb className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ws-gold)' }} />
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Escreva sua explicacao aqui..."
          className="w-full min-h-[200px] rounded-xl px-4 py-3 text-sm resize-none transition-all focus:outline-none focus:ring-2"
          style={{
            background: 'var(--ws-glass)',
            borderColor: 'var(--ws-glass-border)',
            color: 'var(--ws-text-primary)',
            border: '1px solid var(--ws-glass-border)',
          }}
          autoFocus
        />
        <div className="flex items-center justify-between mt-2 px-1">
          <span className={`text-xs transition-colors ${isValid ? '' : ''}`} style={{
            color: isValid ? 'var(--ws-verdigris)' : 'var(--ws-text-tertiary)',
          }}>
            {charCount >= minChars ? (
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Pronto para enviar</span>
            ) : (
              `Minimo ${minChars} caracteres (${minChars - charCount} restantes)`
            )}
          </span>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        whileHover={{ scale: isValid ? 1.01 : 1 }}
        whileTap={{ scale: isValid ? 0.99 : 1 }}
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="w-full rounded-xl px-6 py-3.5 font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: isValid
            ? 'linear-gradient(135deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 80%, var(--ws-gold)))'
            : 'var(--ws-glass-border)',
          boxShadow: isValid ? '0 4px 20px color-mix(in srgb, var(--ws-accent) 30%, transparent)' : 'none',
        }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando sua explicacao...
          </>
        ) : (
          <>
            <GraduationCap className="w-4 h-4" />
            Enviar explicacao
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// ===== IMPROVEMENT CARD =====
function ImprovementCard({ analysis, onNavigate }: { analysis: AnalysisResult; onNavigate: (tab: string) => void }) {
  const improvementSteps = analysis.improvementSteps || [];
  const relatedTopics = analysis.relatedTopicsToStudy || analysis.nextTopics || [];

  if (improvementSteps.length === 0 && relatedTopics.length === 0) return null;

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-xl p-4 space-y-4"
      style={{
        background: 'color-mix(in srgb, var(--ws-accent) 5%, var(--ws-glass))',
        border: '1px solid color-mix(in srgb, var(--ws-accent) 12%, transparent)',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' }}>
          <Wrench className="w-4 h-4" style={{ color: 'var(--ws-accent)' }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>
          Como melhorar
        </h3>
      </div>

      {/* Actionable improvement steps */}
      {improvementSteps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
            Passos para estudar
          </p>
          <div className="space-y-2">
            {improvementSteps.map((step, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-start gap-2.5 rounded-lg px-3 py-2"
                style={{ background: 'color-mix(in srgb, var(--ws-glass) 60%, transparent)' }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                  style={{ background: 'color-mix(in srgb, var(--ws-accent) 15%, transparent)', color: 'var(--ws-accent)' }}>
                  {i + 1}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                  {step}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Related topics to study */}
      {relatedTopics.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
            Topicos relacionados para estudar
          </p>
          <div className="space-y-1.5">
            {relatedTopics.map((relTopic, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg"
                style={{ color: 'var(--ws-text-secondary)' }}>
                <Compass className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ws-verdigris)' }} />
                {relTopic}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study now button */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={() => onNavigate('cadernos')}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
        style={{
          background: 'color-mix(in srgb, var(--ws-accent) 10%, var(--ws-glass))',
          border: '1px solid color-mix(in srgb, var(--ws-accent) 20%, transparent)',
          color: 'var(--ws-accent)',
        }}
      >
        <Notebook className="w-4 h-4" />
        Estudar agora nos cadernos
      </motion.button>
    </motion.div>
  );
}

// ===== RESULTS SCREEN =====
function ResultsScreen({ topic, analysis, xpEarned, onDone, onNewTopic, onNavigate }: {
  topic: string; analysis: AnalysisResult; xpEarned: number; onDone: () => void; onNewTopic: () => void; onNavigate: (tab: string) => void;
}) {
  const grade = analysis.overallGrade || 'F';
  const gradeColor = GRADE_COLORS[grade] || '#8A8A8A';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden" animate="visible"
      className="space-y-5"
    >
      {/* Grade Hero */}
      <motion.div variants={itemVariants} className="text-center pt-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-3"
          style={{
            background: `${gradeColor}15`,
            boxShadow: `0 0 60px ${gradeColor}20`,
          }}
        >
          <span className="text-4xl font-black" style={{ color: gradeColor }}>{grade}</span>
        </motion.div>
        <h2 className="font-serif-jp text-xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
          {GRADE_LABELS[grade] || 'Avaliacao completa'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
          {analysis.summary}
        </p>
      </motion.div>

      {/* Mastery Ring + Score Bars */}
      <motion.div variants={itemVariants} className="rounded-xl p-4 space-y-4"
        style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>
            Dominio estimado
          </h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: `${gradeColor}15` }}>
            <Zap className="w-3 h-3" style={{ color: gradeColor }} />
            <span className="text-xs font-bold" style={{ color: gradeColor }}>{xpEarned} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ScoreRing value={analysis.mastery} size={72} strokeWidth={5} color={gradeColor} />
          <div className="flex-1 space-y-2.5">
            <MeterBar label="Precisao" value={analysis.precision} icon={Target} color={gradeColor} delay={1} />
            <MeterBar label="Profundidade" value={analysis.depth} icon={TrendingUp} color="var(--ws-gold)" delay={2} />
            <MeterBar label="Clareza" value={analysis.clarity} icon={Eye} color="var(--ws-verdigris)" delay={3} />
            <MeterBar label="Completude" value={analysis.completeness} icon={Shield} color="var(--ws-accent)" delay={4} />
          </div>
        </div>
      </motion.div>

      {/* Improvement Card (Como melhorar) */}
      <ImprovementCard analysis={analysis} onNavigate={onNavigate} />

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl p-4"
          style={{ background: 'color-mix(in srgb, var(--ws-verdigris) 5%, var(--ws-glass))', border: '1px solid color-mix(in srgb, var(--ws-verdigris) 15%, transparent)' }}>
          <FeedbackList
            items={analysis.strengths}
            icon={CheckCircle2}
            color="var(--ws-verdigris)"
            title="Pontos fortes"
          />
        </motion.div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl p-4"
          style={{ background: 'color-mix(in srgb, var(--ws-accent) 5%, var(--ws-glass))', border: '1px solid color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
          <FeedbackList
            items={analysis.weaknesses}
            icon={AlertCircle}
            color="var(--ws-accent)"
            title="Pontos a melhorar"
          />
        </motion.div>
      )}

      {/* Corrections */}
      {analysis.corrections && analysis.corrections.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl p-4"
          style={{ background: 'color-mix(in srgb, var(--ws-gold) 5%, var(--ws-glass))', border: '1px solid color-mix(in srgb, var(--ws-gold) 15%, transparent)' }}>
          <FeedbackList
            items={analysis.corrections}
            icon={MessageSquare}
            color="var(--ws-gold)"
            title="Correcoes"
          />
        </motion.div>
      )}

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl p-4"
          style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}>
          <FeedbackList
            items={analysis.suggestions}
            icon={Lightbulb}
            color="var(--ws-indigo)"
            title="Sugestoes de melhoria"
          />
        </motion.div>
      )}

      {/* Questions to Explore */}
      {analysis.questionsToExplore && analysis.questionsToExplore.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl p-4"
          style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}>
          <FeedbackList
            items={analysis.questionsToExplore}
            icon={HelpCircle}
            color="var(--ws-verdigris)"
            title="Perguntas para aprofundar"
          />
        </motion.div>
      )}

      {/* Next Topics */}
      {analysis.nextTopics && analysis.nextTopics.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl p-4"
          style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}>
          <FeedbackList
            items={analysis.nextTopics}
            icon={ArrowRight}
            color="var(--ws-accent)"
            title="Proximos topicos recomendados"
          />
        </motion.div>
      )}

      {/* Encouragement */}
      {analysis.encouragement && (
        <motion.div variants={itemVariants} className="rounded-xl p-4 text-center"
          style={{
            background: 'color-mix(in srgb, var(--ws-gold) 8%, var(--ws-glass))',
            border: '1px solid color-mix(in srgb, var(--ws-gold) 20%, transparent)',
          }}>
          <Star className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--ws-gold)' }} />
          <p className="text-sm font-medium italic" style={{ color: 'var(--ws-text-secondary)' }}>
            &quot;{analysis.encouragement}&quot;
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onNewTopic}
          className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{
            background: 'linear-gradient(135deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 80%, var(--ws-gold)))',
            color: 'white',
            boxShadow: '0 4px 20px color-mix(in srgb, var(--ws-accent) 25%, transparent)',
          }}
        >
          <GraduationCap className="w-4 h-4" />
          Ensinar outro topico
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onDone}
          className="rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          style={{
            background: 'var(--ws-glass)',
            border: '1px solid var(--ws-glass-border)',
            color: 'var(--ws-text-secondary)',
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Refazer
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ===== HISTORY SCREEN =====
function HistoryScreen({ history, onBack }: { history: TeachingHistory[]; onBack: () => void }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial" animate="animate" exit="exit"
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--ws-text-secondary)' }} />
        </motion.button>
        <h2 className="font-serif-jp text-lg font-bold" style={{ color: 'var(--ws-text-primary)' }}>
          Historico de ensinamentos
        </h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--ws-text-tertiary)' }}>
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Voce ainda nao ensinou nenhum conceito.</p>
          <p className="text-xs mt-1">Comece explicando um topico para a IA!</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
          {history.map((item, i) => {
            const gradeColor = GRADE_COLORS[item.grade] || '#8A8A8A';
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                style={{ background: 'var(--ws-glass)', border: '1px solid var(--ws-glass-border)' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: `${gradeColor}15`, color: gradeColor }}>
                  {item.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--ws-text-primary)' }}>
                    {item.topic}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                    {item.subject && `${item.subject} · `}{item.difficulty} · Dominio: {item.mastery}%
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)' }}>
                  <Zap className="w-3 h-3" style={{ color: 'var(--ws-gold)' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--ws-gold)' }}>{item.xpEarned}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== MAIN TEACH VIEW =====
export function TeachView({ onNavigate }: TeachViewProps) {
  const [screen, setScreen] = useState<'topic' | 'explain' | 'results' | 'history'>('topic');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState('intermediario');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [history, setHistory] = useState<TeachingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const data = await apiFetch('/api/subjects').catch(() => null);
        if (data) {
          setSubjects((data.subjects || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            color: s.color || '#6366f1',
            icon: s.icon || 'book',
          })));
        }
      } catch {
        // silently fail
      }
    }
    fetchSubjects();
  }, []);

  const handleSelectTopic = useCallback((topic: string, subject?: string) => {
    setSelectedTopic(topic);
    setSelectedSubject(subject);
    setScreen('explain');
  }, []);

  const handleSubmitExplanation = useCallback(async (explanation: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch('/api/teach', {
        method: 'POST',
        body: JSON.stringify({
          topic: selectedTopic,
          explanation,
          subject: selectedSubject,
          difficulty,
        }),
      });
      setAnalysis(data.analysis);
      setXpEarned(data.xpEarned || 0);
      setScreen('results');
      setShowXP(true);

      // Refresh history
      try {
        const histData = await apiFetch('/api/teach').catch(() => ({ teachings: [] }));
        const teachings = (histData.teachings || []).map((t: any) => {
            try {
              const parsed = JSON.parse(t.content);
              return {
                topic: parsed.topic || 'Desconhecido',
                subject: parsed.subject || null,
                difficulty: parsed.difficulty || 'intermediario',
                mastery: parsed.mastery || 0,
                grade: parsed.grade || '?',
                xpEarned: parsed.xpEarned || 0,
                date: t.createdAt,
              };
            } catch {
              return null;
            }
          }).filter(Boolean);
          setHistory(teachings);
      } catch {
        // ignore
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Tente novamente.' });
      setScreen('explain');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, selectedSubject, difficulty]);

  const handleNewTopic = useCallback(() => {
    setSelectedTopic('');
    setSelectedSubject(undefined);
    setAnalysis(null);
    setXpEarned(0);
    setScreen('topic');
  }, []);

  // Fetch history when switching to history tab
  const handleShowHistory = useCallback(async () => {
    try {
      const data = await apiFetch('/api/teach').catch(() => ({ teachings: [] }));
        const teachings = (data.teachings || []).map((t: any) => {
          try {
            const parsed = JSON.parse(t.content);
            return {
              topic: parsed.topic || 'Desconhecido',
              subject: parsed.subject || null,
              difficulty: parsed.difficulty || 'intermediario',
              mastery: parsed.mastery || 0,
              grade: parsed.grade || '?',
              xpEarned: parsed.xpEarned || 0,
              date: t.createdAt,
            };
          } catch {
            return null;
          }
        }).filter(Boolean);
        setHistory(teachings);
    } catch {
      // ignore
    }
    setScreen('history');
  }, []);

  const hideXP = useCallback(() => setShowXP(false), []);

  // Loading state during API call
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-2 mb-4"
            style={{
              borderColor: 'var(--ws-glass-border)',
              borderTopColor: 'var(--ws-verdigris)',
            }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
            Analisando sua explicacao...
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ws-text-tertiary)' }}>
            A IA esta avaliando precisao, profundidade e clareza
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {screen === 'topic' && (
          <div key="topic">
            {/* History button */}
            <div className="flex justify-end mb-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleShowHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'var(--ws-glass)',
                  border: '1px solid var(--ws-glass-border)',
                  color: 'var(--ws-text-secondary)',
                }}
              >
                <History className="w-3.5 h-3.5" />
                Historico
              </motion.button>
            </div>
            <TopicScreen subjects={subjects} onSelect={handleSelectTopic} />
          </div>
        )}

        {screen === 'explain' && (
          <ExplainScreen
            key="explain"
            topic={selectedTopic}
            subject={selectedSubject}
            difficulty={difficulty}
            onBack={handleNewTopic}
            onSubmit={handleSubmitExplanation}
          />
        )}

        {screen === 'results' && analysis && (
          <ResultsScreen
            key="results"
            topic={selectedTopic}
            analysis={analysis}
            xpEarned={xpEarned}
            onDone={handleNewTopic}
            onNewTopic={handleNewTopic}
            onNavigate={onNavigate}
          />
        )}

        {screen === 'history' && (
          <HistoryScreen
            key="history"
            history={history}
            onBack={handleNewTopic}
          />
        )}
      </AnimatePresence>

      {/* XP Celebration */}
      <AnimatePresence>
        {showXP && <XPCelebration xp={xpEarned} onDone={hideXP} />}
      </AnimatePresence>
    </div>
  );
}

export default TeachView;
