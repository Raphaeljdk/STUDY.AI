'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Trophy, Flame, Target, Clock, Star, Lock, Unlock,
  TrendingUp, Award, Zap, Calendar, BookOpen,
  BarChart3, Timer, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { WabiSabiCard } from './WabiSabiCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';

// ===== TYPES =====

interface ProgressViewProps {
  user: {
    name: string;
    email: string;
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyMinutes: number;
    totalSessions: number;
    createdAt: string;
  };
}

interface GamificationData {
  xp: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalStudyMinutes: number;
  totalSessions: number;
  totalTasksCompleted: number;
  totalFlashcardsReviewed: number;
  totalQuestionsAnswered: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  todayXP: number;
}

interface AchievementData {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface XPBreakdownItem {
  source: string;
  total: number;
}

interface SubjectStat {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  _count: { topics: number; tasks: number };
}

interface StatsData {
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  weeklyStudyMinutes: number;
  totalSessions: number;
  dailyData: { day: string; minutes: number }[];
  subjectStats: SubjectStat[];
  totalTasksCompleted: number;
}

interface XPData {
  xp: number;
  level: number;
  xpBreakdown: XPBreakdownItem[];
  progressPercent: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
}

// ===== CONSTANTS =====

const LEVEL_NAMES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Estudante',
  4: 'Dedicado',
  5: 'Especialista',
};

function getLevelName(level: number): string {
  if (level >= 6) return 'Mestre';
  return LEVEL_NAMES[level] || 'Iniciante';
}

const XP_SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  STUDY_SESSION: { label: 'Sessoes', color: 'var(--ws-accent)' },
  TASK_COMPLETED: { label: 'Tarefas', color: 'var(--ws-gold)' },
  GOAL_COMPLETED: { label: 'Metas', color: 'var(--ws-verdigris)' },
  FLASHCARD_REVIEW: { label: 'Flashcards', color: '#D97706' },
  QUIZ_COMPLETED: { label: 'Simulados', color: '#92400E' },
  SIMULADO_COMPLETED: { label: 'Simulados', color: '#92400E' },
  STREAK_BONUS: { label: 'Bonus Streak', color: '#DC2626' },
  DAILY_LOGIN: { label: 'Login Diario', color: '#78716C' },
  MANUAL: { label: 'Manual', color: '#A8A29E' },
};

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

const ACHIEVEMENTS = [
  { key: 'first_session', icon: '🏆', title: 'Primeira Sessao', description: 'Complete sua primeira sessao' },
  { key: 'streak_3', icon: '🔥', title: '3 Dias Seguidos', description: 'Estude 3 dias seguidos' },
  { key: 'streak_7', icon: '🔥', title: '7 Dias Seguidos', description: 'Estude 7 dias seguidos' },
  { key: 'hours_10', icon: '📚', title: '10 Horas', description: 'Acumule 10 horas de estudo' },
  { key: 'hours_50', icon: '📚', title: '50 Horas', description: 'Acumule 50 horas' },
  { key: 'questions_100', icon: '🧠', title: '100 Questoes', description: 'Responda 100 questoes' },
  { key: 'first_goal', icon: '🎯', title: 'Primeira Meta', description: 'Complete sua primeira meta' },
  { key: 'perfect_quiz', icon: '💯', title: 'Perfeito', description: 'Simulado perfeito' },
  { key: 'focused_5', icon: '⚡', title: 'Focado', description: '5 sessoes em um dia' },
  { key: 'night_owl', icon: '🌙', title: 'Noturno', description: 'Estude apos meia-noite' },
];

const WARM_COLORS = ['var(--ws-accent)', 'var(--ws-gold)', 'var(--ws-verdigris)', '#D97706', '#92400E'];

// ===== ANIMATION VARIANTS =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

// ===== ANIMATED COUNTER =====

function AnimatedCounter({ target, duration = 1200, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return <span>{display.toLocaleString('pt-BR')}{suffix}</span>;
}

// ===== CUSTOM TOOLTIP =====

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-3 py-2 shadow-lg backdrop-blur-xl">
      <p className="text-xs font-medium text-[var(--ws-text-secondary)]">{label}</p>
      <p className="text-sm font-bold text-[var(--ws-text-primary)]">
        {payload[0].value} min
      </p>
    </div>
  );
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; value: number } }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-3 py-2 shadow-lg backdrop-blur-xl">
      <p className="text-xs font-medium text-[var(--ws-text-secondary)]">{d.label}</p>
      <p className="text-sm font-bold text-[var(--ws-text-primary)]">
        {d.value} XP
      </p>
    </div>
  );
}

// ===== LOADING SKELETONS =====

function ProfileSkeleton() {
  return (
    <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-6" style={{ borderRadius: 'var(--ws-radius-card)' }}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <Skeleton className="mx-auto h-6 w-40 sm:mx-0" />
          <Skeleton className="mx-auto h-4 w-52 sm:mx-0" />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-6" style={{ borderRadius: 'var(--ws-radius-card)' }}>
      <Skeleton className="mb-4 h-6 w-40" />
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

function AchievementGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4" style={{ borderRadius: 'var(--ws-radius-card)' }}>
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN COMPONENT =====

export function ProgressView({ user }: ProgressViewProps) {
  // --- Data State ---
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [subjects, setSubjects] = useState<SubjectStat[]>([]);

  // --- Loading State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gamRes, achRes, xpRes, statsRes, subRes] = await Promise.all([
        fetch('/api/gamification').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/achievements').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/xp').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/stats').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/subjects').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      ]);
      setGamification(gamRes);
      setAchievements(achRes.achievements || []);
      setXpData(xpRes);
      setStats(statsRes);
      setSubjects(subRes.subjects || []);
    } catch {
      setError('Nao foi possivel carregar os dados de progresso.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- Derived Values ---
  const totalHours = Math.round((user.totalStudyMinutes || 0) / 60 * 10) / 10;
  const weeklyHours = stats ? Math.round((stats.weeklyStudyMinutes || 0) / 60 * 10) / 10 : 0;
  const todayMinutes = stats?.todayStudyMinutes || 0;
  const avgSessionMinutes = (user.totalSessions || 0) > 0
    ? Math.round((user.totalStudyMinutes || 0) / user.totalSessions)
    : 0;

  // Best study day of week from daily data
  const bestDay = (() => {
    if (!stats?.dailyData || stats.dailyData.length === 0) return null;
    // Use a full week's worth of data from all-sessions endpoint if available
    // For now, derive from the dailyData we have
    const maxDay = stats.dailyData.reduce((best, d) => d.minutes > (best?.minutes || 0) ? d : best, stats.dailyData[0]);
    return maxDay.minutes > 0 ? maxDay.day : null;
  })();

  // Merge predefined achievements with API data
  const mergedAchievements = ACHIEVEMENTS.map(pre => {
    const apiAch = achievements.find(a => a.key === pre.key);
    return {
      ...pre,
      unlocked: apiAch?.unlocked || false,
      unlockedAt: apiAch?.unlockedAt || null,
    };
  });

  // XP breakdown for pie chart
  const xpChart = xpData?.xpBreakdown
    ?.filter(b => b.total > 0)
    .map(b => ({
      name: XP_SOURCE_LABELS[b.source]?.label || b.source,
      value: b.total,
      color: XP_SOURCE_LABELS[b.source]?.color || 'var(--ws-text-tertiary)',
    })) || [];

  // Weekly chart data (Mon-Sun)
  const weeklyChartData = (() => {
    if (!stats?.dailyData) return [];
    // dailyData from API is last 7 days, we show as-is
    return stats.dailyData.map(d => ({
      day: d.day,
      minutes: d.minutes,
    }));
  })();

  // Subject performance data
  const subjectPerformance = (() => {
    if (!subjects.length) return [];
    const maxTasks = Math.max(...subjects.map(s => s._count.tasks), 1);
    return subjects.map(s => ({
      ...s,
      taskPercent: Math.round((s._count.tasks / maxTasks) * 100),
    }));
  })();

  // --- Avatar Initials ---
  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const joinDate = user.createdAt
    ? format(parseISO(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  // Level info from gamification or user prop
  const level = gamification?.level || user.level;
  const xp = gamification?.xp || user.xp;
  const progressPercent = gamification?.progressPercent || 0;
  const xpInCurrentLevel = gamification?.xpInCurrentLevel || 0;
  const xpNeededForNextLevel = gamification?.xpNeededForNextLevel || 100;

  // ===== RENDER =====

  if (error && !loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-[var(--ws-accent)]" />
        <p className="text-[var(--ws-text-secondary)]">{error}</p>
        <button
          onClick={fetchAllData}
          className="rounded-lg bg-[var(--ws-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--ws-accent-hover)]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-6 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-2">
        <span className="mb-2 inline-block font-serif-jp text-sm tracking-[0.3em] text-[var(--ws-accent)]">
          進歩 · SHINPO
        </span>
        <h1 className="font-serif-jp text-3xl text-[var(--ws-text-primary)] md:text-4xl">
        Progresso e Conquistas
        </h1>
        <p className="mt-2 text-[var(--ws-text-secondary)]">
        Acompanhe sua evolucao, conquistas e estatisticas de estudo.
        </p>
      </motion.div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap gap-1">
          <TabsTrigger value="progress" className="flex-1 gap-1.5">
            <TrendingUp size={16} />
            <span className="hidden sm:inline">Progresso</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 gap-1.5">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Analise</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex-1 gap-1.5">
            <Award size={16} />
            <span className="hidden sm:inline">Conquistas</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex-1 gap-1.5">
            <BookOpen size={16} />
            <span className="hidden sm:inline">Materias</span>
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB: PROGRESS ========== */}
        <TabsContent value="progress" className="space-y-6">
          {/* SECTION 1: Profile Card */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <ProfileSkeleton />
            ) : (
              <WabiSabiCard hover={false} className="relative overflow-hidden">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="flex h-20 w-20 items-center justify-center text-2xl font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 60%, var(--ws-gold)))',
                        borderRadius: '50%',
                      }}
                    >
                      {initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ws-gold)] text-xs font-bold text-white shadow-md">
                      {level}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-[var(--ws-text-primary)]">{user.name}</h2>
                    <p className="mt-0.5 text-sm text-[var(--ws-text-tertiary)]">{user.email}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <Badge
                        className="border-[var(--ws-accent)] bg-[var(--ws-accent)] text-white hover:bg-[var(--ws-accent-hover)]"
                      >
                        <Star size={12} className="mr-1" />
                        {getLevelName(level)}
                      </Badge>
                      <Badge variant="outline" className="border-[var(--ws-glass-border)]">
                        <Flame size={12} className="mr-1 text-orange-500" />
                        {user.currentStreak} dias
                      </Badge>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-[var(--ws-text-tertiary)]">Membro desde</p>
                    <p className="text-sm font-medium text-[var(--ws-text-secondary)]">{joinDate}</p>
                  </div>
                </div>

                <Separator className="my-5 bg-[var(--ws-glass-border)]" />

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[var(--ws-bg-dark)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--ws-accent)]">
                      <AnimatedCounter target={xp} />
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ws-text-tertiary)]">XP Total</p>
                  </div>
                  <div className="rounded-lg bg-[var(--ws-bg-dark)] p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame size={18} className="text-orange-500" />
                      <p className="text-2xl font-bold text-orange-500">{user.currentStreak}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--ws-text-tertiary)]">Sequencia atual</p>
                  </div>
                  <div className="rounded-lg bg-[var(--ws-bg-dark)] p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy size={18} className="text-[var(--ws-gold)]" />
                      <p className="text-2xl font-bold text-[var(--ws-gold)]">{user.longestStreak}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--ws-text-tertiary)]">Recorde</p>
                  </div>
                  <div className="rounded-lg bg-[var(--ws-bg-dark)] p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={18} className="text-[var(--ws-verdigris)]" />
                      <p className="text-2xl font-bold text-[var(--ws-verdigris)]">
                        <AnimatedCounter target={totalHours} suffix="h" />
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--ws-text-tertiary)]">Horas totais</p>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--ws-text-secondary)]">
                      Nivel {level} · {getLevelName(level)}
                    </span>
                    <span className="text-xs text-[var(--ws-text-tertiary)]">
                      {xpInCurrentLevel} / {xpNeededForNextLevel} XP
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--ws-bg-dark)]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 70%, var(--ws-gold)))',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </div>
              </WabiSabiCard>
            )}
          </motion.div>

          {/* SECTION 2: XP Breakdown */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <WabiSabiCard hover={false}>
                <div className="mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-[var(--ws-gold)]" />
                  <h3 className="font-serif-jp text-lg text-[var(--ws-text-primary)]">Distribuicao de XP</h3>
                </div>

                {xpChart.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pie Chart */}
                    <div className="flex items-center justify-center">
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={xpChart}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              dataKey="value"
                              stroke="none"
                              paddingAngle={3}
                            >
                              {xpChart.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col justify-center gap-2">
                      {xpChart.map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--ws-bg-dark)]">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-[var(--ws-text-secondary)]">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-[var(--ws-text-primary)]">
                            {item.value.toLocaleString('pt-BR')} XP
                          </span>
                        </div>
                      ))}
                      <Separator className="my-1 bg-[var(--ws-glass-border)]" />
                      <div className="flex items-center justify-between px-3">
                        <span className="text-sm font-bold text-[var(--ws-text-primary)]">Total</span>
                        <span className="text-sm font-bold text-[var(--ws-accent)]">
                          {xp.toLocaleString('pt-BR')} XP
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-[var(--ws-text-tertiary)]">
                    <Zap size={32} className="opacity-40" />
                    <p className="text-sm">Nenhum XP acumulado ainda. Comece a estudar!</p>
                  </div>
                )}
              </WabiSabiCard>
            )}
          </motion.div>
        </TabsContent>

        {/* ========== TAB: ANALYTICS ========== */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Stats Cards Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
            ) : (
              <>
                <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4 text-center" style={{ borderRadius: 'var(--ws-radius-card)' }}>
                  <Clock size={20} className="mx-auto mb-1 text-[var(--ws-accent)]" />
                  <p className="text-xl font-bold text-[var(--ws-text-primary)]">
                    <AnimatedCounter target={totalHours} suffix="h" />
                  </p>
                  <p className="text-xs text-[var(--ws-text-tertiary)]">Horas totais</p>
                </div>
                <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4 text-center" style={{ borderRadius: 'var(--ws-radius-card)' }}>
                  <TrendingUp size={20} className="mx-auto mb-1 text-[var(--ws-verdigris)]" />
                  <p className="text-xl font-bold text-[var(--ws-text-primary)]">
                    <AnimatedCounter target={weeklyHours} suffix="h" />
                  </p>
                  <p className="text-xs text-[var(--ws-text-tertiary)]">Horas esta semana</p>
                </div>
                <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4 text-center" style={{ borderRadius: 'var(--ws-radius-card)' }}>
                  <Timer size={20} className="mx-auto mb-1 text-[var(--ws-gold)]" />
                  <p className="text-xl font-bold text-[var(--ws-text-primary)]">{todayMinutes}m</p>
                  <p className="text-xs text-[var(--ws-text-tertiary)]">Hoje</p>
                </div>
                <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4 text-center" style={{ borderRadius: 'var(--ws-radius-card)' }}>
                  <BarChart3 size={20} className="mx-auto mb-1 text-[#D97706]" />
                  <p className="text-xl font-bold text-[var(--ws-text-primary)]">{avgSessionMinutes}m</p>
                  <p className="text-xs text-[var(--ws-text-tertiary)]">Media por sessao</p>
                </div>
                <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4 text-center" style={{ borderRadius: 'var(--ws-radius-card)' }}>
                  <Target size={20} className="mx-auto mb-1 text-[var(--ws-accent)]" />
                  <p className="text-xl font-bold text-[var(--ws-text-primary)]">{user.totalSessions}</p>
                  <p className="text-xs text-[var(--ws-text-tertiary)]">Total de sessoes</p>
                </div>
              </>
            )}
          </motion.div>

          {/* Weekly Chart */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <WabiSabiCard hover={false}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-[var(--ws-accent)]" />
                    <h3 className="font-serif-jp text-lg text-[var(--ws-text-primary)]">Horas esta Semana</h3>
                  </div>
                  {bestDay && (
                    <Badge variant="outline" className="border-[var(--ws-glass-border)]">
                      <Star size={12} className="mr-1 text-[var(--ws-gold)]" />
                      Melhor: {bestDay}
                    </Badge>
                  )}
                </div>

                {weeklyChartData.length > 0 && weeklyChartData.some(d => d.minutes > 0) ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                        <XAxis
                          dataKey="day"
                          tick={{ fill: 'var(--ws-text-tertiary)', fontSize: 12 }}
                          axisLine={{ stroke: 'var(--ws-glass-border)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'var(--ws-text-tertiary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          unit="m"
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar
                          dataKey="minutes"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        >
                          {weeklyChartData.map((_, index) => (
                            <Cell
                              key={`bar-${index}`}
                              fill={WARM_COLORS[index % WARM_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-[var(--ws-text-tertiary)]">
                    <BarChart3 size={32} className="opacity-40" />
                    <p className="text-sm">Nenhum estudo registrado esta semana.</p>
                  </div>
                )}
              </WabiSabiCard>
            )}
          </motion.div>

          {/* Best Study Day Card */}
          <motion.div variants={itemVariants}>
            <WabiSabiCard hover={false}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ws-bg-dark)]">
                  <Calendar size={24} className="text-[var(--ws-gold)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--ws-text-tertiary)]">Melhor dia de estudo</p>
                  <p className="text-lg font-bold text-[var(--ws-text-primary)]">
                    {bestDay || 'Nenhum dado'}
                  </p>
                </div>
              </div>
            </WabiSabiCard>
          </motion.div>
        </TabsContent>

        {/* ========== TAB: ACHIEVEMENTS ========== */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Achievement Summary */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-48" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ws-bg-dark)]">
                  <Award size={20} className="text-[var(--ws-gold)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--ws-text-tertiary)]">Conquistas desbloqueadas</p>
                  <p className="text-lg font-bold text-[var(--ws-text-primary)]">
                    {mergedAchievements.filter(a => a.unlocked).length} / {mergedAchievements.length}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Achievements Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 gap-4 lg:grid-cols-3"
          >
            {loading ? (
              <AchievementGridSkeleton />
            ) : (
              mergedAchievements.map((ach) => (
                <motion.div
                  key={ach.key}
                  variants={itemVariants}
                  className={`relative overflow-hidden border p-4 backdrop-blur-xl transition-all ${
                    ach.unlocked
                      ? 'border-[var(--ws-glass-border)] bg-[var(--ws-glass)]'
                      : 'border-[var(--ws-glass-border)] bg-[var(--ws-bg-dark)] opacity-60'
                  }`}
                  style={{ borderRadius: 'var(--ws-radius-card)' }}
                  whileHover={ach.unlocked ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } : undefined}
                >
                  {/* Lock overlay for locked achievements */}
                  {!ach.unlocked && (
                    <div className="absolute right-2 top-2">
                      <Lock size={14} className="text-[var(--ws-text-tertiary)]" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                        ach.unlocked
                          ? 'bg-[var(--ws-bg-dark)]'
                          : 'bg-[var(--ws-bg)] grayscale'
                      }`}
                    >
                      {ach.unlocked ? ach.icon : '🔒'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-sm font-semibold ${
                        ach.unlocked
                          ? 'text-[var(--ws-text-primary)]'
                          : 'text-[var(--ws-text-tertiary)]'
                      }`}>
                        {ach.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-[var(--ws-text-tertiary)] line-clamp-2">
                        {ach.description}
                      </p>
                      {ach.unlocked && ach.unlockedAt && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-[var(--ws-verdigris)]">
                          <Unlock size={10} />
                          {format(parseISO(ach.unlockedAt), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </TabsContent>

        {/* ========== TAB: SUBJECTS ========== */}
        <TabsContent value="subjects" className="space-y-6">
          <motion.div variants={itemVariants}>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <WabiSabiCard hover={false}>
                <div className="mb-5 flex items-center gap-2">
                  <BookOpen size={20} className="text-[var(--ws-accent)]" />
                  <h3 className="font-serif-jp text-lg text-[var(--ws-text-primary)]">Desempenho por Materia</h3>
                </div>

                {subjectPerformance.length > 0 ? (
                  <div className="space-y-5">
                    {subjectPerformance.map((subject, i) => {
                      const subjectColor = subject.color || WARM_COLORS[i % WARM_COLORS.length];
                      return (
                        <motion.div
                          key={subject.id}
                          variants={itemVariants}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: subjectColor }}
                              />
                              <span className="text-sm font-medium text-[var(--ws-text-primary)]">
                                {subject.name}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--ws-text-tertiary)]">
                              {subject._count.tasks} tarefa{subject._count.tasks !== 1 ? 's' : ''} · {subject._count.topics} topico{subject._count.topics !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {/* Task completion bar */}
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--ws-bg-dark)]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: subjectColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(subject.taskPercent, 2)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-[var(--ws-text-tertiary)]">
                    <BookOpen size={32} className="opacity-40" />
                    <p className="text-sm">Nenhuma materia cadastrada ainda.</p>
                  </div>
                )}
              </WabiSabiCard>
            )}
          </motion.div>

          {/* Subject Study Time Bars */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <WabiSabiCard hover={false}>
                <div className="mb-5 flex items-center gap-2">
                  <Clock size={20} className="text-[var(--ws-gold)]" />
                  <h3 className="font-serif-jp text-lg text-[var(--ws-text-primary)]">Tarefas por Materia</h3>
                </div>

                {subjectPerformance.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectPerformance.map((s, i) => ({
                          name: s.name.length > 12 ? s.name.slice(0, 12) + '...' : s.name,
                          tasks: s._count.tasks,
                          color: s.color || WARM_COLORS[i % WARM_COLORS.length],
                        }))}
                        layout="vertical"
                        margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fill: 'var(--ws-text-tertiary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: 'var(--ws-text-secondary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={120}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="tasks" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {subjectPerformance.map((s, index) => (
                            <Cell
                              key={`subj-bar-${index}`}
                              fill={s.color || WARM_COLORS[index % WARM_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-[var(--ws-text-tertiary)]">
                    <Clock size={32} className="opacity-40" />
                    <p className="text-sm">Adicione materias e tarefas para ver dados aqui.</p>
                  </div>
                )}
              </WabiSabiCard>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default ProgressView;
