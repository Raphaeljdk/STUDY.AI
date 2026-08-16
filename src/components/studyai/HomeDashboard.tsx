'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Flame, Clock, ClipboardList, Brain,
  Plus, BookOpen, Play, RotateCcw,
  Sparkles, Calendar, Target, Trophy,
  ChevronRight, Loader2, FolderOpen, Zap, BookPlus, ArrowRight,
} from 'lucide-react';
import { WabiSabiCard } from './WabiSabiCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

// ===== TYPES =====
interface HomeDashboardProps {
  user: {
    name: string;
    email: string;
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyMinutes: number;
    totalSessions: number;
  };
  stats: {
    minutesToday: number;
    minutesThisWeek: number;
    pendingTasks: number;
    dueFlashcards: number;
    subjectCount: number;
    completedToday: number;
  } | null;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
    color?: string | null;
  }>;
  todayTasks: Array<{
    id: string;
    title: string;
    priority: string;
    subjectName?: string | null;
  }>;
  onNavigate: (tab: string) => void;
}

interface GoalItem {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

// ===== HELPERS =====
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getGreetingSubtext(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Comece o dia com foco e determinacao. Cada estudo e um passo adiante.';
  if (h < 18) return 'A tarde e perfeita para revisar e consolidar o conhecimento.';
  return 'Boas sessoes noturnas fixam melhor o que voce aprendeu.';
}

function getLevelName(level: number): string {
  if (level <= 1) return 'Iniciante';
  if (level <= 2) return 'Aprendiz';
  if (level <= 3) return 'Estudante';
  if (level <= 4) return 'Dedicado';
  if (level <= 5) return 'Especialista';
  return 'Mestre';
}

function getXpForLevel(level: number): number {
  // XP thresholds: 0->100->250->500->850->1300...
  const thresholds = [0, 100, 250, 500, 850, 1300];
  if (level <= 0) return 0;
  if (level >= thresholds.length) {
    // Beyond defined levels: 450 per level
    const lastDefined = thresholds[thresholds.length - 1];
    return lastDefined + (level - (thresholds.length - 1)) * 450;
  }
  return thresholds[level];
}

function getPriorityIndicator(priority: string) {
  switch (priority?.toUpperCase()) {
    case 'ALTA': return { dot: 'bg-red-500', label: 'Alta', emoji: '🔴' };
    case 'MEDIA': return { dot: 'bg-amber-500', label: 'Media', emoji: '🟡' };
    case 'BAIXA': return { dot: 'bg-green-500', label: 'Baixa', emoji: '🟢' };
    default: return { dot: 'bg-gray-400', label: priority || 'Media', emoji: '🟡' };
  }
}

function getEventTypeLabel(type: string) {
  switch (type?.toUpperCase()) {
    case 'EXAM': return 'Prova';
    case 'DELIVERY': return 'Entrega';
    case 'EVENT': return 'Evento';
    case 'STUDY': return 'Sessao';
    default: return type || 'Evento';
  }
}

function getEventColor(color?: string | null, type?: string) {
  if (color) return color;
  switch (type?.toUpperCase()) {
    case 'EXAM': return '#D93838';
    case 'DELIVERY': return '#B8A088';
    case 'STUDY': return '#5B8C5A';
    default: return 'var(--ws-accent)';
  }
}

// Framer motion variants
const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

// ===== MAIN COMPONENT =====
export function HomeDashboard({
  user,
  stats: propsStats,
  upcomingEvents: propsEvents,
  todayTasks: propsTasks,
  onNavigate,
}: HomeDashboardProps) {
  // Derive initial loading state — skip fetching if stats were passed via props
  const hasInitialProps = !!propsStats;
  const [stats, setStats] = useState<HomeDashboardProps['stats']>(propsStats);
  const [todayTasks, setTodayTasks] = useState<HomeDashboardProps['todayTasks']>((propsTasks || []) as HomeDashboardProps['todayTasks']);
  const [upcomingEvents, setUpcomingEvents] = useState<HomeDashboardProps['upcomingEvents']>((propsEvents || []) as HomeDashboardProps['upcomingEvents']);
  const [dailyGoals, setDailyGoals] = useState<GoalItem[]>([] as GoalItem[]);
  const [loading, setLoading] = useState(!hasInitialProps);

  useEffect(() => {
    if (hasInitialProps) return;

    const month = format(new Date(), 'yyyy-MM');

    Promise.all([
      apiFetch('/api/stats').catch(() => null),
      apiFetch('/api/tasks?status=PENDING&limit=5').catch(() => null),
      apiFetch(`/api/calendar?month=${month}`).catch(() => null),
      apiFetch('/api/goals?type=DAILY').catch(() => null),
    ]).then(([statsData, tasksData, eventsData, goalsData]) => {
      if (statsData) {
        setStats({
          minutesToday: statsData.todayMinutes ?? 0,
          minutesThisWeek: statsData.weeklyStudyMinutes ?? 0,
          pendingTasks: statsData.pendingTasksCount ?? 0,
          dueFlashcards: statsData.dueFlashcards ?? 0,
          subjectCount: statsData.notebooks ?? 0,
          completedToday: statsData.tasksCompletedToday ?? 0,
        });
      }
      if (tasksData?.tasks) {
        setTodayTasks(tasksData.tasks.map((t: any) => ({
          ...t,
          subjectName: t.subject?.name ?? t.subjectName ?? null,
        })));
      }
      if (eventsData?.events) setUpcomingEvents(eventsData.events);
      if (goalsData?.goals) setDailyGoals(goalsData.goals);
    }).finally(() => setLoading(false));
  }, [propsStats, propsTasks, propsEvents]);

  // XP calculations
  const currentLevelXp = getXpForLevel(user.level);
  const nextLevelXp = getXpForLevel(user.level + 1);
  const xpInCurrentLevel = user.xp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const xpProgress = xpNeededForNext > 0 ? Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100) : 100;
  const levelName = getLevelName(user.level);

  const firstName = user.name?.split(' ')[0] || 'Estudante';
  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';

  // Study plan slots (placeholder AI recommendation)
  const studyPlanSlots = stats && stats.subjectCount > 0
    ? [
        { time: 'Agora', activity: 'Revisar flashcards pendentes', duration: '15 min', icon: Brain },
        { time: '+30 min', activity: 'Estudar anotacoes recentes', duration: '25 min', icon: BookOpen },
        { time: '+1h', activity: 'Praticar com Pomodoro', duration: '25 min', icon: Clock },
      ]
    : [];

  // Safety wrappers — guarantee arrays even if state gets corrupted
  const safeTasks = Array.isArray(todayTasks) ? todayTasks : []
  const safeEvents = Array.isArray(upcomingEvents) ? upcomingEvents : []
  const safeGoals = Array.isArray(dailyGoals) ? dailyGoals : []
  const safeStudyPlanSlots = Array.isArray(studyPlanSlots) ? studyPlanSlots : []

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="skeleton mb-2 h-8 w-64" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="skeleton-card mb-6 h-48" />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card h-28" />
          ))}
        </div>
        <div className="skeleton-card mb-6 h-40" />
        <div className="skeleton-card mb-6 h-32" />
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="skeleton-card h-48" />
          <div className="skeleton-card h-48" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ===== 1. GREETING SECTION ===== */}
      <motion.section
        className="mb-6"
        {...fadeInUp}
        transition={{ duration: 0.5 }}
        aria-label="Saudacao"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar - hidden on mobile (shown in mobile header) */}
          <div
            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full font-serif-jp text-lg font-bold text-[var(--ws-text-on-dark)] sm:flex"
            style={{
              background: `linear-gradient(135deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 70%, var(--ws-gold)))`,
            }}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)] sm:text-2xl lg:text-3xl">
                {getGreeting()}!
              </h1>
              <Badge
                className="gap-1 rounded-ws-button border-0 px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--ws-accent) 15%, transparent)',
                  color: 'var(--ws-accent)',
                }}
              >
                <Trophy size={12} />
                Nivel {user.level} · {levelName}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
              {getGreetingSubtext()}
            </p>

            {/* XP Progress Bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full"
                style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 65%, var(--ws-gold)))`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-[var(--ws-text-tertiary)]">
                {xpInCurrentLevel}/{xpNeededForNext} XP
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== 2. STUDY PLAN CARD ===== */}
      <motion.section
        className="mb-6"
        {...fadeInUp}
        transition={{ duration: 0.5, delay: 0.08 }}
        aria-label="Plano de estudo"
      >
        <WabiSabiCard hover={false}>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-ws-button"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}
            >
              <Sparkles size={16} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)]">
                O que estudar agora?
              </h2>
              <p className="text-xs text-[var(--ws-text-tertiary)]">
                Plano sugerido pela sua StudyAI
              </p>
            </div>
          </div>

          {safeStudyPlanSlots.length > 0 ? (
            <div className="space-y-2.5">
              {safeStudyPlanSlots.map((slot, i) => (
                <motion.button
                  key={i}
                  className="flex w-full items-center gap-3 rounded-ws-button p-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_4%,transparent)]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  onClick={() => {
                    if (slot.icon === Brain) onNavigate('flashcards');
                    else if (slot.icon === BookOpen) onNavigate('notebooks');
                    else if (slot.icon === Clock) onNavigate('timer');
                  }}
                >
                  <span className="shrink-0 text-xs font-bold text-[var(--ws-text-tertiary)] w-12">
                    {slot.time}
                  </span>
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ws-button"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--ws-gold) 15%, transparent)' }}
                  >
                    <slot.icon size={14} className="text-[var(--ws-gold)]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ws-text-primary)] truncate">
                      {slot.activity}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--ws-text-tertiary)]">
                    {slot.duration}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}
              >
                <FolderOpen size={24} className="text-[var(--ws-accent)]" strokeWidth={1} />
              </div>
              <p className="text-sm font-medium text-[var(--ws-text-secondary)]">
                Nenhuma materia cadastrada ainda
              </p>
              <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">
                Adicione suas materias para receber planos de estudo personalizados
              </p>
              <button
                onClick={() => onNavigate('notebooks')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ws-accent)] transition-colors hover:text-[var(--ws-accent-hover)]"
              >
                <Plus size={14} />
                Adicionar materia
              </button>
            </div>
          )}
        </WabiSabiCard>
      </motion.section>

      {/* ===== 3. STATS GRID ===== */}
      <motion.section
        className="mb-6 grid grid-cols-2 gap-3 sm:gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        aria-label="Estatisticas do dia"
      >
        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <WabiSabiCard>
            <div className="flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-ws-button"
                style={{ backgroundColor: 'color-mix(in srgb, #F97316 15%, transparent)' }}
              >
                <Flame size={20} className="text-[#F97316]" strokeWidth={1.5} />
              </div>
              {user.longestStreak > 0 && user.longestStreak > user.currentStreak && (
                <span className="text-[10px] text-[var(--ws-text-tertiary)]">
                  Recorde: {user.longestStreak} dias
                </span>
              )}
            </div>
            <p className="mt-3 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] sm:mt-4 sm:text-3xl">
              {user.currentStreak}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--ws-text-secondary)] sm:text-sm">
              Sequencia
            </p>
            <p className="text-[10px] text-[var(--ws-text-tertiary)] sm:text-xs">dias seguidos</p>
          </WabiSabiCard>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <WabiSabiCard>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-ws-button"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ws-gold) 15%, transparent)' }}
            >
              <Clock size={20} className="text-[var(--ws-gold)]" strokeWidth={1.5} />
            </div>
            <p className="mt-3 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] sm:mt-4 sm:text-3xl">
              {stats?.minutesToday ?? 0}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--ws-text-secondary)] sm:text-sm">
              Hoje
            </p>
            <p className="text-[10px] text-[var(--ws-text-tertiary)] sm:text-xs">minutos de estudo</p>
          </WabiSabiCard>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <WabiSabiCard>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-ws-button"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ws-verdigris) 15%, transparent)' }}
            >
              <ClipboardList size={20} className="text-[var(--ws-verdigris)]" strokeWidth={1.5} />
            </div>
            <p className="mt-3 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] sm:mt-4 sm:text-3xl">
              {stats?.completedToday ?? 0}
              <span className="ml-1 text-base font-normal text-[var(--ws-text-tertiary)] sm:text-lg">
                /{stats?.pendingTasks ?? 0}
              </span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--ws-text-secondary)] sm:text-sm">
              Tarefas
            </p>
            <p className="text-[10px] text-[var(--ws-text-tertiary)] sm:text-xs">concluidas hoje</p>
          </WabiSabiCard>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
          <WabiSabiCard>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-ws-button"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}
            >
              <Brain size={20} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
            </div>
            <p className="mt-3 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] sm:mt-4 sm:text-3xl">
              {stats?.dueFlashcards ?? 0}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--ws-text-secondary)] sm:text-sm">
              Flashcards
            </p>
            <p className="text-[10px] text-[var(--ws-text-tertiary)] sm:text-xs">para revisar</p>
            {(stats?.dueFlashcards ?? 0) > 0 && (
              <button
                onClick={() => onNavigate('flashcards')}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ws-accent)] hover:underline"
              >
                Revisar agora <ArrowRight size={12} />
              </button>
            )}
          </WabiSabiCard>
        </motion.div>
      </motion.section>

      {/* ===== 4. XP & LEVEL CARD ===== */}
      <motion.section
        className="mb-6"
        {...fadeInUp}
        transition={{ duration: 0.5, delay: 0.25 }}
        aria-label="Nivel e XP"
      >
        <WabiSabiCard hover={false}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Circular progress */}
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                {/* Background circle */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="color-mix(in srgb, var(--ws-accent) 12%, transparent)"
                  strokeWidth="6"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--ws-accent)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - xpProgress / 100) }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
                  {user.level}
                </span>
                <span className="text-[10px] font-medium text-[var(--ws-text-tertiary)]">NIVEL</span>
              </div>
            </div>

            {/* Level info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h2 className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">
                  {levelName}
                </h2>
                <Zap size={16} className="text-amber-500" />
              </div>
              <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
                Total de <span className="font-semibold text-[var(--ws-text-secondary)]">{user.xp} XP</span> acumulados
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 60%, var(--ws-gold)))`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
                <span className="shrink-0 text-xs text-[var(--ws-text-tertiary)]">
                  {xpNeededForNext - xpInCurrentLevel} XP para o proximo nivel
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--ws-text-tertiary)] sm:justify-start">
                <span className="flex items-center gap-1">
                  <Flame size={12} className="text-[#F97316]" />
                  {user.totalSessions} sessoes
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-[var(--ws-gold)]" />
                  {user.totalStudyMinutes} min totais
                </span>
              </div>
            </div>
          </div>
        </WabiSabiCard>
      </motion.section>

      {/* ===== 5. QUICK ACTIONS ===== */}
      <motion.section
        className="mb-6"
        {...fadeInUp}
        transition={{ duration: 0.5, delay: 0.3 }}
        aria-label="Acoes rapidas"
      >
        <div className="flex flex-wrap gap-2.5">
          {[
            { icon: BookPlus, label: 'Adicionar materia', action: () => onNavigate('notebooks') },
            { icon: ClipboardList, label: 'Nova tarefa', action: () => onNavigate('tasks') },
            { icon: Play, label: 'Iniciar sessao', action: () => onNavigate('timer') },
            { icon: RotateCcw, label: 'Revisar flashcards', action: () => onNavigate('flashcards') },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={btn.action}
              className="flex items-center gap-2 rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-2.5 text-sm font-medium text-[var(--ws-text-secondary)] transition-colors hover:border-[var(--ws-accent)]/20 hover:text-[var(--ws-accent)]"
            >
              <btn.icon size={15} strokeWidth={1.5} />
              <span className="hidden sm:inline">{btn.label}</span>
              <span className="sm:hidden text-xs">{btn.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ===== 6 + 7: EVENTS & TASKS (side by side on desktop) ===== */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* 6. PROXIMOS EVENTOS */}
        <motion.section
          {...fadeInUp}
          transition={{ duration: 0.5, delay: 0.35 }}
          aria-label="Proximos eventos"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)]">
              Proximos Eventos
            </h2>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium text-[var(--ws-accent)] hover:underline"
            >
              Ver calendario
            </button>
          </div>

          {safeEvents.length > 0 ? (
            <WabiSabiCard hover={false} className="p-0 overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--ws-glass-border)]">
                {safeEvents.map((event, i) => {
                  const eventColor = getEventColor(event.color, event.type);
                  return (
                    <motion.div
                      key={event.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_3%,transparent)]"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                    >
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: eventColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--ws-text-primary)]">
                          {event.title}
                        </p>
                        <p className="text-xs text-[var(--ws-text-tertiary)]">
                          {getEventTypeLabel(event.type)} · {format(parseISO(event.date), "d 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </WabiSabiCard>
          ) : (
            <WabiSabiCard hover={false}>
              <div className="py-4 text-center">
                <Calendar size={28} className="mx-auto mb-2 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
                <p className="text-sm text-[var(--ws-text-tertiary)]">
                  Nenhum evento proximo
                </p>
              </div>
            </WabiSabiCard>
          )}
        </motion.section>

        {/* 7. TAREFAS DE HOJE */}
        <motion.section
          {...fadeInUp}
          transition={{ duration: 0.5, delay: 0.4 }}
          aria-label="Tarefas de hoje"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)]">
              Tarefas de Hoje
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-medium text-[var(--ws-accent)] hover:underline"
            >
              Ver todas
            </button>
          </div>

          {safeTasks.length > 0 ? (
            <WabiSabiCard hover={false} className="p-0 overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--ws-glass-border)]">
                {safeTasks.map((task, i) => {
                  const priority = getPriorityIndicator(task.priority);
                  return (
                    <motion.div
                      key={task.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_3%,transparent)]"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                    >
                      <span className="shrink-0 text-xs" role="img" aria-label={priority.label}>
                        {priority.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--ws-text-primary)]">
                          {task.title}
                        </p>
                        {task.subjectName && (
                          <p className="text-xs text-[var(--ws-text-tertiary)]">
                            {task.subjectName}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-ws-button border-[var(--ws-glass-border)] px-1.5 py-0 text-[10px] font-normal text-[var(--ws-text-tertiary)]"
                      >
                        {priority.label}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </WabiSabiCard>
          ) : (
            <WabiSabiCard hover={false}>
              <div className="py-4 text-center">
                <Target size={28} className="mx-auto mb-2 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
                <p className="text-sm text-[var(--ws-text-tertiary)]">
                  Nenhuma tarefa pendente para hoje
                </p>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="mt-2 text-xs font-medium text-[var(--ws-accent)] hover:underline"
                >
                  Criar tarefa
                </button>
              </div>
            </WabiSabiCard>
          )}
        </motion.section>
      </div>

      {/* ===== 8. METAS DO DIA ===== */}
      {safeGoals.length > 0 && (
        <motion.section
          className="mb-6"
          {...fadeInUp}
          transition={{ duration: 0.5, delay: 0.45 }}
          aria-label="Metas do dia"
        >
          <div className="mb-3 flex items-center gap-2">
            <Target size={16} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
          <h2 className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)]">
            Metas do Dia
          </h2>
          </div>

          <WabiSabiCard hover={false}>
            <div className="space-y-4">
              {safeGoals.map((goal, i) => {
                const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
                const isComplete = progress >= 100;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                >
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--ws-text-primary)]">
                        {goal.title}
                      </p>
                      <span className={`text-xs font-medium ${isComplete ? 'text-[var(--ws-verdigris)]' : 'text-[var(--ws-text-tertiary)]'}`}>
                        {goal.current}/{goal.target} {goal.unit}
                        {isComplete && ' ✓'}
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2"
                      style={{
                        // @ts-expect-error CSS custom properties for styling
                        '--progress-color': isComplete
                          ? 'var(--ws-verdigris)'
                          : 'var(--ws-accent)',
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </WabiSabiCard>
        </motion.section>
      )}
    </motion.div>
  );
}

export default HomeDashboard;
