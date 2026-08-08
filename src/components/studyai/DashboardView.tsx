'use client';

import { useState, useEffect, useRef, useCallback, Component, type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen, Brain, BarChart3, MessageCircle, Clock,
  LogOut, Shield, ChevronRight, Star, Send,
  Plus, Trash2, Edit3, X, Timer, RotateCcw,
  Check, AlertCircle, Loader2, BookPlus, FolderOpen, Zap, ArrowLeft,
  Sparkles, TrendingUp, Target, Calendar, Flame, Search, Trash, Filter, Hash, Copy, Users, Crown,
  ListTodo, Flag, Trophy, CalendarDays, Compass, Swords, Rocket, Route, Siren, Dna
} from 'lucide-react';
import { WabiSabiCard } from './WabiSabiCard';
import { ZenButton } from './ZenButton';
import { EnsoCircle } from './EnsoCircle';
import { AdminPanel } from './AdminPanel';
import { toast } from '@/hooks/use-toast';
import { useUsage } from '@/hooks/useUsage';
import { PremiumUpgrade, UsageBar } from './PremiumUpgrade';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const CanvasNotebookView = dynamic(
  () => import('@/components/notebook/CanvasNotebookView').then(m => ({ default: m.CanvasNotebookView })),
  { ssr: false, loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--ws-glass-border)] border-t-[var(--ws-accent)]" />
        <p className="text-sm text-[var(--ws-text-tertiary)]">Carregando editor...</p>
      </div>
    </div>
  )},
);

// @ts-expect-error dynamic import
const HomeDashboard = dynamic(() => import('./HomeDashboard'), { ssr: false });
// @ts-expect-error dynamic import
const SubjectsView = dynamic(() => import('./SubjectsView'), { ssr: false });
// @ts-expect-error dynamic import
const TasksView = dynamic(() => import('./TasksView'), { ssr: false });
// @ts-expect-error dynamic import
const GoalsView = dynamic(() => import('./GoalsView'), { ssr: false });
// @ts-expect-error dynamic import
const CalendarView = dynamic(() => import('./CalendarView'), { ssr: false });
// @ts-expect-error dynamic import
const ProgressView = dynamic(() => import('./ProgressView'), { ssr: false });
// @ts-expect-error dynamic import
const DiscoverView = dynamic(() => import('./DiscoverView'), { ssr: false });
// @ts-expect-error dynamic import
const BattleView = dynamic(() => import('./BattleView'), { ssr: false });
// @ts-expect-error dynamic import
const MicroLessonView = dynamic(() => import('./MicroLessonView'), { ssr: false });
// @ts-expect-error dynamic import
const MissionsView = dynamic(() => import('./MissionsView'), { ssr: false });
// @ts-expect-error dynamic import
const BrainView = dynamic(() => import('./BrainView'), { ssr: false });
// @ts-expect-error dynamic import
const RoadmapView = dynamic(() => import('./RoadmapView'), { ssr: false });
// @ts-expect-error dynamic import
const EmergencyView = dynamic(() => import('./EmergencyView'), { ssr: false });

// Lightweight error boundary for individual sections
class SectionErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode; name?: string }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode; name?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SectionErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}]`, error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-[var(--ws-glass-border)] p-6">
          <div className="text-center">
            <AlertCircle size={24} className="mx-auto mb-3 text-[var(--ws-accent)]" />
            <p className="text-sm font-medium text-[var(--ws-text-primary)]">Erro ao carregar esta secao</p>
            <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">{this.state.error?.message || 'Erro desconhecido'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="mt-3 text-xs font-medium text-[var(--ws-accent)] hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safe rich text editor with fallback to plain textarea
function SafeEditor({ content, onChange, placeholder, onError }: { content: string; onChange: (html: string) => void; placeholder: string; onError?: (msg: string) => void }) {
  const [editorReady, setEditorReady] = useState(false);
  const [editorFailed, setEditorFailed] = useState(false);
  const [EditorComp, setEditorComp] = useState<React.ComponentType<{ content: string; onChange: (html: string) => void; placeholder: string }> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    import('./RichTextEditor')
      .then(m => { setEditorComp(() => m.RichTextEditor); setEditorReady(true); })
      .catch((err) => {
        console.warn('[SafeEditor] RichTextEditor failed to load, using fallback:', err);
        setEditorFailed(true);
        onError?.(err?.message || 'Editor falhou ao carregar');
      });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onChange(val), 500);
  }, [onChange]);

  if (editorFailed) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--ws-accent)]/10 px-3 py-2 text-xs text-[var(--ws-accent)]">
          <AlertCircle size={14} /> Editor avancado indisponivel. Usando editor simples.
        </div>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="min-h-[400px] w-full resize-none bg-transparent p-5 text-sm leading-relaxed text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none"
        />
      </div>
    );
  }

  if (!editorReady) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[var(--ws-glass-border)] border-t-[var(--ws-accent)]" />
          <p className="text-xs text-[var(--ws-text-tertiary)]">Carregando editor...</p>
        </div>
      </div>
    );
  }

  if (EditorComp) return <EditorComp content={content} onChange={onChange} placeholder={placeholder} />;
  return null;
}

const notebookColors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#f39c12'];

type Tab = 'dashboard' | 'discover' | 'battle' | 'microlesson' | 'missions' | 'subjects' | 'tasks' | 'goals' | 'calendar' | 'notebooks' | 'notebook-edit' | 'flashcards' | 'flashcard-review' | 'timer' | 'chat' | 'brain' | 'roadmap' | 'emergency' | 'progress' | 'admin';

interface NotebookItem { id: string; title: string; content: string; color: string; _count?: { flashcards: number }; updatedAt: string; flashcards?: FlashcardItem[]; }
interface FlashcardItem { id: string; front: string; back: string; notebookId: string | null; easeFactor: number; interval: number; repetitions: number; nextReview: string; }
interface StatsData {
  notebooks: number;
  flashcards: number;
  studiedFlashcards: number;
  dueFlashcards: number;
  masteredCards: number;
  studyTime: string;
  todayMinutes: number;
  chatCount: number;
  streak: number;
  dailyData: { day: string; minutes: number }[];
  weeklySessions: number;
}
interface ChatMsg { id: string; role: string; content: string; createdAt: string; }

// ========== ACTIVE USERS HOOK ==========
function useActiveUsers() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const base = 87;
    const tick = () => setCount(base + Math.floor(Math.random() * 30));
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);
  return count;
}

// ========== SWIPE HOOK ==========
function useSwipeGestures(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchEndX.current - touchStartX.current;
    if (Math.abs(diff) > 80) {
      if (diff < 0) onSwipeLeft();
      else onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}

// ========== MAIN ==========
const tabOrder: Tab[] = ['dashboard', 'discover', 'battle', 'microlesson', 'missions', 'subjects', 'tasks', 'goals', 'calendar', 'notebooks', 'flashcards', 'timer', 'chat', 'brain', 'roadmap', 'emergency', 'progress', 'admin'];

export function DashboardView() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editNotebookId, setEditNotebookId] = useState<string | null>(null);
  const activeUsers = useActiveUsers();
  const usage = useUsage();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'chat' | 'flashcards' | 'nav'>('nav');

  const openUpgrade = (type: 'chat' | 'flashcards' | 'nav' = 'nav') => {
    setUpgradeTrigger(type);
    setUpgradeOpen(true);
  };

  const openNotebook = (id: string) => {
    if (!id) { setActiveTab('notebooks'); return; }
    setEditNotebookId(id);
    setActiveTab('notebook-edit');
  };

  const navigateTo = (tab: string) => setActiveTab(tab as Tab);

  // Swipe navigation for mobile
  const validTabs = tabOrder.filter(t => t !== 'admin' || isAdmin);
  const validIndex = validTabs.indexOf(activeTab);
  const swipeHandlers = useSwipeGestures(
    () => { if (validIndex < validTabs.length - 1) setActiveTab(validTabs[validIndex + 1]); },
    () => { if (validIndex > 0) setActiveTab(validTabs[validIndex - 1]); },
  );

  return (
    <div className="min-h-screen bg-[var(--ws-bg)]" {...swipeHandlers}>
      <header className="sticky top-0 z-50 border-b border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-24">
          <button onClick={() => activeTab !== 'dashboard' && setActiveTab('dashboard')} className="flex items-center gap-2 sm:gap-3">
            <Image src="/logo.png" alt="StudyAI" width={32} height={32} className="rounded-full" />
            <span className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)] sm:text-lg">StudyAI</span>
          </button>
          <nav className="flex items-center gap-0.5 overflow-x-auto md:gap-1 no-scrollbar">
            <TabBtn icon={BarChart3} label="Home" tooltip="Visao geral" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabBtn icon={Compass} label="Discover" tooltip="Feed de estudos" active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
            <TabBtn icon={Swords} label="Batalha" tooltip="Duelo de conhecimento" active={activeTab === 'battle'} onClick={() => setActiveTab('battle')} />
            <TabBtn icon={Zap} label="60s" tooltip="Aprenda em 60 segundos" active={activeTab === 'microlesson'} onClick={() => setActiveTab('microlesson')} />
            <TabBtn icon={Rocket} label="Missoes" tooltip="Missoes de estudo" active={activeTab === 'missions'} onClick={() => setActiveTab('missions')} />
            <TabBtn icon={BookOpen} label="Materias" tooltip="Suas materias" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
            <TabBtn icon={ListTodo} label="Tarefas" tooltip="Suas tarefas" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
            <TabBtn icon={FolderOpen} label="Cadernos" tooltip="Seus cadernos" active={activeTab === 'notebooks' || activeTab === 'notebook-edit'} onClick={() => setActiveTab('notebooks')} />
            <TabBtn icon={Brain} label="Cards" tooltip="Revisao espacada" active={activeTab === 'flashcards' || activeTab === 'flashcard-review'} onClick={() => setActiveTab('flashcards')} />
            <TabBtn icon={Timer} label="Timer" tooltip="Timer de foco" active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} />
            <TabBtn icon={MessageCircle} label="Sensei" tooltip="Tutor IA" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            <TabBtn icon={Dna} label="Brain" tooltip="StudyAI Brain" active={activeTab === 'brain'} onClick={() => setActiveTab('brain')} />
            <TabBtn icon={Route} label="Trilhas" tooltip="Trilhas de aprendizagem" active={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
            <TabBtn icon={Siren} label="Emergencia" tooltip="Estudo de emergencia" active={activeTab === 'emergency'} onClick={() => setActiveTab('emergency')} />
            <TabBtn icon={Trophy} label="Progresso" tooltip="Desempenho" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
            {isAdmin && <TabBtn icon={Shield} label="Admin" tooltip="Painel admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="mr-1 hidden items-center gap-1.5 text-xs text-[var(--ws-text-tertiary)] lg:flex">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--ws-verdigris)]" />
              <Users size={10} />
              <span>{activeUsers}</span>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--ws-text-primary)]">{user?.name}</p>
              <p className="text-xs text-[var(--ws-accent)]">{usage.isPremium ? 'Premium' : isAdmin ? 'Admin · Ilimitado' : 'Gratuito'}{isAdmin && ' · Admin'}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ws-glass-border)] font-serif-jp text-xs font-bold text-[var(--ws-accent)] sm:h-9 sm:w-9 sm:text-sm">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <button onClick={() => signOut({ callbackUrl: '/' })} data-ws-tooltip="Sair" className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]"><LogOut size={18} /></button>
          </div>
        </div>
        <div className="flex overflow-x-auto md:hidden no-scrollbar px-1">
          <TabBtn icon={BarChart3} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabBtn icon={BookOpen} label="Matérias" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
          <TabBtn icon={ListTodo} label="Tarefas" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <TabBtn icon={Target} label="Metas" active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
          <TabBtn icon={CalendarDays} label="Calend." active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <TabBtn icon={Dna} label="Brain" active={activeTab === 'brain'} onClick={() => setActiveTab('brain')} />
          <TabBtn icon={Route} label="Trilhas" active={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
          <TabBtn icon={Siren} label="Emerg." active={activeTab === 'emergency'} onClick={() => setActiveTab('emergency')} />
          <TabBtn icon={FolderOpen} label="Cadernos" active={activeTab === 'notebooks' || activeTab === 'notebook-edit'} onClick={() => setActiveTab('notebooks')} />
          <TabBtn icon={Brain} label="Cards" active={activeTab === 'flashcards' || activeTab === 'flashcard-review'} onClick={() => setActiveTab('flashcards')} />
          <TabBtn icon={Timer} label="Timer" active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} />
          <TabBtn icon={MessageCircle} label="Sensei" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <TabBtn icon={Trophy} label="Progresso" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
          {!usage.isPremium && !isAdmin && (
            <TabBtn icon={Crown} label="Premium" active={false} onClick={() => openUpgrade('nav')} />
          )}
          {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6 lg:px-24 lg:py-8">
        {/* Usage bars — only for free users */}
        {!usage.isPremium && !usage.loading && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <UsageBar type="chatMessages" used={usage.usage.chatMessages} limit={usage.limits.chatMessages} />
            <UsageBar type="flashcards" used={usage.usage.flashcards} limit={usage.limits.flashcards} />
          </div>
        )}
        {activeTab === 'dashboard' && (
          <SectionErrorBoundary name="HomeDashboard">
            <HomeDashboard user={user} onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'discover' && (
          <SectionErrorBoundary name="DiscoverView">
            <DiscoverView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'battle' && (
          <SectionErrorBoundary name="BattleView">
            <BattleView />
          </SectionErrorBoundary>
        )}
        {activeTab === 'microlesson' && (
          <SectionErrorBoundary name="MicroLessonView">
            <MicroLessonView />
          </SectionErrorBoundary>
        )}
        {activeTab === 'missions' && (
          <SectionErrorBoundary name="MissionsView">
            <MissionsView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'subjects' && (
          <SectionErrorBoundary name="SubjectsView">
            <SubjectsView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'tasks' && (
          <SectionErrorBoundary name="TasksView">
            <TasksView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'goals' && (
          <SectionErrorBoundary name="GoalsView">
            <GoalsView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'calendar' && (
          <SectionErrorBoundary name="CalendarView">
            <CalendarView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'notebooks' && <NotebooksList key="nb-list" onOpen={openNotebook} />}
        {activeTab === 'notebook-edit' && editNotebookId && (
          <SectionErrorBoundary name="CanvasNotebook">
            <CanvasNotebookView notebookId={editNotebookId} onBack={() => setActiveTab('notebooks')} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'flashcards' && <FlashcardsManager key="fc" onReview={() => setActiveTab('flashcard-review')} />}
        {activeTab === 'flashcard-review' && <FlashcardReviewer key="fcr" onBack={() => setActiveTab('flashcards')} />}
        {activeTab === 'timer' && <PomodoroTimer key="pom" />}
        {activeTab === 'chat' && <SenseiChat key="chat" />}
        {activeTab === 'brain' && (
          <SectionErrorBoundary name="BrainView">
            <BrainView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'roadmap' && (
          <SectionErrorBoundary name="RoadmapView">
            <RoadmapView />
          </SectionErrorBoundary>
        )}
        {activeTab === 'emergency' && (
          <SectionErrorBoundary name="EmergencyView">
            <EmergencyView onNavigate={navigateTo} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'progress' && (
          <SectionErrorBoundary name="ProgressView">
            <ProgressView user={user} />
          </SectionErrorBoundary>
        )}
        {activeTab === 'admin' && isAdmin && <AdminPanel key="adm" />}
      </main>

      {/* Premium upgrade modal */}
      <PremiumUpgrade isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} triggerType={upgradeTrigger} />
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick, tooltip }: { icon: any; label: string; active: boolean; onClick: () => void; tooltip?: string }) {
  return (
    <button 
      onClick={onClick} 
      {...(tooltip ? { 'data-ws-tooltip': tooltip } : {})}
      className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${active ? 'text-[var(--ws-accent)]' : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'}`}
    >
      <Icon size={16} /><span className="hidden sm:inline">{label}</span>
      {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--ws-accent)]" />}
    </button>
  );
}

// ========== HELPER: Time-based greeting ==========
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

function formatReviewDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Atrasado';
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanha';
  if (diffDays <= 7) return `em ${diffDays} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getStatusBadge(repetitions: number): { label: string; color: string; bg: string } {
  if (repetitions === 0) return { label: 'Novo', color: 'var(--ws-accent)', bg: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' };
  if (repetitions < 5) return { label: 'Revisando', color: 'var(--ws-gold)', bg: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)' };
  return { label: 'Dominado', color: 'var(--ws-verdigris)', bg: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)' };
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ========== DASHBOARD HOME ==========
function DashboardHome({ user, openNotebook, onNavigate }: { user: any; openNotebook: (id: string) => void; onNavigate: (tab: Tab) => void }) {
  const [stats, setStats] = useState<StatsData>({
    notebooks: 0, flashcards: 0, studiedFlashcards: 0, dueFlashcards: 0,
    masteredCards: 0, studyTime: '0m', todayMinutes: 0, chatCount: 0,
    streak: 0, dailyData: [], weeklySessions: 0,
  });
  const [recentNBs, setRecentNBs] = useState<NotebookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/notebooks').then(r => r.json()),
    ]).then(([statsData, nbData]) => {
      if (statsData.notebooks !== undefined) setStats(statsData);
      if (nbData.notebooks) setRecentNBs(nbData.notebooks.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-circle mb-3 h-10 w-10" />
              <div className="skeleton mb-1 h-7 w-12" />
              <div className="skeleton h-3 w-20" />
              <div className="skeleton mt-1 h-3 w-14" />
            </div>
          ))}
        </div>
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div className="skeleton-card h-52" />
          <div className="space-y-3">
            <div className="skeleton h-5 w-36" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-card flex items-center gap-3">
                <div className="skeleton skeleton-circle h-10 w-10 shrink-0" />
                <div className="flex-1">
                  <div className="skeleton mb-1.5 h-4 w-28" />
                  <div className="skeleton h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stripHtml = (h: string) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const maxMinutes = Math.max(...stats.dailyData.map(d => d.minutes), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
          {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">{getGreetingSubtext()}</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { Icon: BookOpen, title: 'Cadernos', value: String(stats.notebooks), desc: 'Ativos', accent: false },
          { Icon: Brain, title: 'Flashcards', value: String(stats.flashcards), desc: `${stats.masteredCards} dominados`, accent: false },
          { Icon: Target, title: 'Revisoes Pendentes', value: String(stats.dueFlashcards), desc: 'Para hoje', accent: stats.dueFlashcards > 0 },
          { Icon: Clock, title: 'Minutos Hoje', value: String(stats.todayMinutes), desc: 'de estudo', accent: false },
          { Icon: Flame, title: 'Streak', value: String(stats.streak), desc: 'dias seguidos', accent: stats.streak > 0 },
        ].map((c, i) => (
          <motion.button
            key={c.title}
            className="w-full text-left"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <WabiSabiCard>
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-ws-button"
                  style={{ backgroundColor: c.accent ? 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' : 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}
                >
                  <c.Icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="mt-4 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">{c.value}</p>
              <p className="mt-1 text-sm font-medium text-[var(--ws-text-secondary)]">{c.title}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">{c.desc}</p>
            </WabiSabiCard>
          </motion.button>
        ))}
      </div>

      {/* Weekly Study Chart + Quick Access */}
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Mini Weekly Chart */}
        <WabiSabiCard hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]">
              <TrendingUp size={14} className="mr-1.5 inline" />Estudo Semanal
            </h2>
            <span className="text-xs text-[var(--ws-text-tertiary)]">{stats.studyTime} esta semana</span>
          </div>
          <div className="flex h-36 items-end justify-between gap-2">
            {stats.dailyData.map((d, i) => {
              const height = Math.max((d.minutes / maxMinutes) * 100, d.minutes > 0 ? 8 : 4);
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-[var(--ws-text-tertiary)]">
                    {d.minutes > 0 ? `${d.minutes}m` : ''}
                  </span>
                  <motion.div
                    className="w-full rounded-t-md"
                    style={{ backgroundColor: d.minutes > 0 ? 'color-mix(in srgb, var(--ws-accent) 40%, transparent)' : 'color-mix(in srgb, var(--ws-glass-border) 40%, transparent)', minHeight: 4 }}
                    initial={{ height: 4 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                  />
                  <span className="text-[10px] text-[var(--ws-text-tertiary)]">{d.day}</span>
                </div>
              );
            })}
          </div>
        </WabiSabiCard>

        {/* Quick Access */}
        <div>
          <h2 className="mb-4 font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Acesso Rapido</h2>
          <div className="space-y-3">
            {[
              { icon: BookOpen, title: 'Abrir Caderno', desc: 'Continue de onde parou', action: () => openNotebook('') },
              { icon: Brain, title: 'Revisar Flashcards', desc: stats.dueFlashcards > 0 ? `${stats.dueFlashcards} cartas pendentes` : 'Nenhuma carta pendente', action: () => onNavigate('flashcards') },
              { icon: Timer, title: 'Pomodoro Timer', desc: 'Estude com foco', action: () => onNavigate('timer') },
              { icon: MessageCircle, title: 'Perguntar ao Sensei', desc: `${stats.chatCount} conversas ate agora`, action: () => onNavigate('chat') },
            ].map((a) => (
              <button key={a.title} onClick={a.action} className="w-full text-left">
                <WabiSabiCard hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                      <a.icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--ws-text-primary)]">{a.title}</p>
                      <p className="text-xs text-[var(--ws-text-tertiary)]">{a.desc}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                  </div>
                </WabiSabiCard>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Notebooks */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Cadernos Recentes</h2>
          <button onClick={() => openNotebook('')} className="text-xs font-medium text-[var(--ws-accent)] hover:underline">Ver todos</button>
        </div>
        {!loading && recentNBs.length === 0 ? (
          <WabiSabiCard hover={false}>
            <div className="py-6 text-center">
              <FolderOpen size={36} className="mx-auto mb-3 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
              <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum caderno criado</p>
              <button onClick={() => openNotebook('')} className="mt-2 text-sm font-medium text-[var(--ws-accent)] hover:underline">Criar primeiro caderno</button>
            </div>
          </WabiSabiCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentNBs.map((nb, i) => (
              <motion.button
                key={nb.id}
                onClick={() => openNotebook(nb.id)}
                className="w-full text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <WabiSabiCard hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ws-button" style={{ backgroundColor: nb.color + '18' }}>
                      <BookOpen size={18} style={{ color: nb.color }} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ws-text-primary)]">{nb.title}</p>
                      <p className="line-clamp-1 text-xs text-[var(--ws-text-tertiary)]">{stripHtml(nb.content).substring(0, 80) || 'Sem conteudo'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[var(--ws-text-tertiary)]">{nb._count?.flashcards || 0} cards</p>
                      <p className="text-[10px] text-[var(--ws-text-tertiary)]">{new Date(nb.updatedAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </WabiSabiCard>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ========== NOTEBOOKS LIST ==========
function NotebooksList({ onOpen }: { onOpen: (id: string) => void }) {
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(notebookColors[0]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/notebooks').then(r => r.json()).then(d => {
      if (d.notebooks) setNotebooks(d.notebooks);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/notebooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, color: newColor }) });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Erro ao criar caderno', description: data.error || 'Tente novamente.', variant: 'destructive' });
        setCreating(false);
        return;
      }
      if (data.notebook) {
        setNotebooks(prev => [data.notebook, ...prev]);
        setNewTitle('');
        setCreating(false);
        onOpen(data.notebook.id);
        toast({ title: 'Caderno criado!', description: `"${data.notebook.title}" esta pronto.` });
      }
    } catch (err) {
      console.error('[NotebooksList] create error:', err);
      toast({ title: 'Erro de conexao', description: 'Nao foi possivel criar o caderno. Verifique sua conexao.', variant: 'destructive' });
    } 
    setCreating(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deletar "${title}"?`)) return;
    try {
      const res = await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotebooks(prev => prev.filter(n => n.id !== id));
        toast({ title: 'Caderno deletado', description: `"${title}" foi removido.` });
      } else {
        const d = await res.json();
        toast({ title: 'Erro ao deletar', description: d.error || 'Tente novamente.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('[NotebooksList] delete error:', err);
      toast({ title: 'Erro de conexao', description: 'Nao foi possivel deletar.', variant: 'destructive' });
    }
  };

  const stripHtml = (h: string) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">Meus Cadernos</h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Organize seus estudos por assunto</p>
      </div>
      <WabiSabiCard className="mb-8" hover={false}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Novo Caderno</label>
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Matematica, Historia, Biologia..." className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Cor</label>
            <div className="flex gap-2">{notebookColors.map(c => (
              <button key={c} type="button" onClick={() => setNewColor(c)} className={`h-8 w-8 rounded-full border-2 transition-transform ${newColor === c ? 'scale-110 border-[var(--ws-text-primary)]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
            ))}</div>
          </div>
          <ZenButton type="submit" variant="primary" size="md" disabled={creating || !newTitle.trim()}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
          </ZenButton>
        </form>
      </WabiSabiCard>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="flex items-center gap-3">
                <div className="skeleton skeleton-circle h-10 w-10 shrink-0" />
                <div className="flex-1">
                  <div className="skeleton mb-1.5 h-4 w-32" />
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton mt-1 h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notebooks.length === 0 ? (
        <div className="py-16 text-center">
          <FolderOpen size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum caderno criado ainda</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((nb, i) => (
            <motion.div key={nb.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <WabiSabiCard>
                <button onClick={() => onOpen(nb.id)} className="w-full text-left">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: nb.color + '18' }}>
                        <BookOpen size={18} style={{ color: nb.color }} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--ws-text-primary)]">{nb.title}</p>
                        <p className="text-xs text-[var(--ws-text-tertiary)]">{nb._count?.flashcards || 0} flashcards</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                  </div>
                  {nb.content && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ws-text-tertiary)]">{stripHtml(nb.content).substring(0, 120)}</p>}
                  <p className="mt-2 text-[10px] text-[var(--ws-text-tertiary)]">{new Date(nb.updatedAt).toLocaleDateString('pt-BR')}</p>
                </button>
                <div className="mt-3 flex justify-end border-t border-[var(--ws-glass-border)] pt-3">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(nb.id, nb.title); }} className="rounded-ws-button p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] hover:text-[var(--ws-accent)]" title="Deletar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </WabiSabiCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ========== FLASHCARDS MANAGER ==========
function FlashcardsManager({ onReview }: { onReview: () => void }) {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [dueCount, setDueCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genContent, setGenContent] = useState('');
  const [showGenForm, setShowGenForm] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    Promise.all([
      fetch('/api/flashcards').then(r => r.json()),
      fetch('/api/flashcards?due=true').then(r => r.json()),
    ]).then(([allData, dueData]) => {
      if (allData.flashcards) setFlashcards(allData.flashcards);
      if (dueData.flashcards) setDueCount(dueData.flashcards.length);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredCards = flashcards.filter(fc =>
    !search.trim() || fc.front.toLowerCase().includes(search.toLowerCase()) || fc.back.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ front, back }) });
      const data = await res.json();
      if (data.flashcard) { setFlashcards(prev => [data.flashcard, ...prev]); setFront(''); setBack(''); setShowForm(false); }
    } catch (err) {
      console.error('[FlashcardsManager] create error:', err);
      toast({ title: 'Erro ao criar flashcard', description: 'Tente novamente.', variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/flashcards/${id}`, { method: 'DELETE' });
    setFlashcards(prev => prev.filter(f => f.id !== id));
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genContent.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: genContent, count: 5 }) });
      const data = await res.json();

      if (data.code === 'USAGE_LIMIT') {
        toast({ title: 'Limite diario atingido', description: `Voce ja usou suas ${data.usage.limit} geracoes de flashcards hoje. Upgrade para Premium!`, variant: 'destructive' });
        setGenerating(false);
        return;
      }

      if (data.flashcards && data.flashcards.length > 0) {
        for (const fc of data.flashcards) {
          const r = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ front: fc.front, back: fc.back }) });
          const d = await r.json();
          if (d.flashcard) setFlashcards(prev => [d.flashcard, ...prev]);
        }
        setGenContent('');
        setShowGenForm(false);
      }
    } catch (err) {
      console.error('[FlashcardsManager] AI generate error:', err);
      toast({ title: 'Erro ao gerar', description: 'Nao foi possivel gerar flashcards com IA.', variant: 'destructive' });
    }
    setGenerating(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
            <Brain size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Flashcards
          </h1>
          <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Crie cartas e revise com spaced repetition</p>
        </div>
        {dueCount > 0 && (
          <ZenButton variant="primary" size="md" onClick={onReview}>
            <Target size={16} /> Revisar Agora ({dueCount})
          </ZenButton>
        )}
      </div>

      {/* Create & AI Generate */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <WabiSabiCard hover={false}>
          <button onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-between text-left">
            <h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]"><BookPlus size={14} className="mr-1.5 inline" /> {showForm ? 'Fechar' : 'Criar Flashcard'}</h2>
            <motion.div animate={{ rotate: showForm ? 45 : 0 }}><Plus size={16} className="text-[var(--ws-text-tertiary)]" /></motion.div>
          </button>
          {showForm && (
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Frente (pergunta)</label>
                <input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="O que e fotossintese?" className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Verso (resposta)</label>
                <textarea value={back} onChange={e => setBack(e.target.value)} placeholder="Processo pelo qual plantas convertem luz..." rows={3} className="w-full resize-none rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" />
              </div>
              <ZenButton type="submit" variant="primary" size="md" className="w-full" disabled={creating || !front.trim() || !back.trim()}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar Flashcard
              </ZenButton>
            </form>
          )}
        </WabiSabiCard>

        <WabiSabiCard hover={false}>
          <button onClick={() => setShowGenForm(!showGenForm)} className="flex w-full items-center justify-between text-left">
            <h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]"><Sparkles size={14} className="mr-1.5 inline text-[var(--ws-accent)]" /> Gerar com IA</h2>
            <motion.div animate={{ rotate: showGenForm ? 45 : 0 }}><Plus size={16} className="text-[var(--ws-text-tertiary)]" /></motion.div>
          </button>
          {showGenForm && (
            <form onSubmit={handleAIGenerate} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Conteudo de estudo</label>
                <textarea value={genContent} onChange={e => setGenContent(e.target.value)} placeholder="Cole aqui o conteudo que deseja transformar em flashcards..." rows={4} className="w-full resize-none rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" />
              </div>
              <ZenButton type="submit" variant="primary" size="md" className="w-full" disabled={generating || !genContent.trim()}>
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {generating ? 'Gerando...' : 'Gerar 5 Flashcards'}
              </ZenButton>
            </form>
          )}
        </WabiSabiCard>
      </div>

      {/* Search */}
      {flashcards.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar flashcards..."
            className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] py-3 pl-11 pr-4 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none backdrop-blur-xl transition-colors focus:border-[var(--ws-accent)]/30"
          />
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>
      ) : flashcards.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
          <Brain size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum flashcard criado ainda</p>
          <div className="mt-6 mx-auto max-w-sm space-y-2 text-left">
            <div className="flex items-start gap-2 rounded-ws-button border border-[var(--ws-glass-border)] p-3">
              <Hash size={14} className="mt-0.5 shrink-0 text-[var(--ws-accent)]" />
              <p className="text-xs text-[var(--ws-text-tertiary)]">Crie flashcards manualmente acima ou use a IA para gerar a partir de conteudo de estudo.</p>
            </div>
            <div className="flex items-start gap-2 rounded-ws-button border border-[var(--ws-glass-border)] p-3">
              <BookOpen size={14} className="mt-0.5 shrink-0 text-[var(--ws-accent)]" />
              <p className="text-xs text-[var(--ws-text-tertiary)]">Voce tambem pode criar flashcards diretamente dentro de um caderno.</p>
            </div>
            <div className="flex items-start gap-2 rounded-ws-button border border-[var(--ws-glass-border)] p-3">
              <Target size={14} className="mt-0.5 shrink-0 text-[var(--ws-accent)]" />
              <p className="text-xs text-[var(--ws-text-tertiary)]">Use o algoritmo SM-2 para revisar no momento ideal e fixar o conhecimento.</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((fc, i) => {
            const status = getStatusBadge(fc.repetitions);
            return (
              <motion.div key={fc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <WabiSabiCard hover={false}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: status.color, backgroundColor: status.bg }}>{status.label}</span>
                      </div>
                      <p className="text-xs font-medium text-[var(--ws-text-secondary)]">Frente</p>
                      <p className="mt-1 text-sm font-medium text-[var(--ws-text-primary)]">{fc.front}</p>
                      <p className="mt-2 text-xs font-medium text-[var(--ws-text-secondary)]">Verso</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--ws-text-tertiary)]">{fc.back}</p>
                    </div>
                    <button onClick={() => handleDelete(fc.id)} className="shrink-0 p-1 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-accent)]"><Trash2 size={14} /></button>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--ws-glass-border)] pt-3">
                    <span className="text-[10px] text-[var(--ws-text-tertiary)]">Repeticoes: {fc.repetitions}x</span>
                    <span className="text-[10px] font-medium text-[var(--ws-accent)]">Proxima: {formatReviewDate(fc.nextReview)}</span>
                  </div>
                </WabiSabiCard>
              </motion.div>
            );
          })}
          {filteredCards.length === 0 && flashcards.length > 0 && (
            <div className="col-span-full py-8 text-center">
              <Search size={32} className="mx-auto mb-3 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
              <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum flashcard encontrado para "{search}"</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ========== FLASHCARD REVIEWER ==========
function FlashcardReviewer({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [ratings, setRatings] = useState<number[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/flashcards?due=true').then(r => r.json()).then(d => {
      if (d.flashcards) setCards(d.flashcards);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleReview = useCallback(async (quality: number) => {
    const card = cards[currentIndex];
    if (!card) return;
    try {
      await fetch(`/api/flashcards/${card.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review: quality }) });
    } catch {}
    setReviewed(prev => prev + 1);
    setRatings(prev => [...prev, quality]);
    setFlipped(false);
    if (currentIndex + 1 >= cards.length) setDone(true);
    else setCurrentIndex(prev => prev + 1);
  }, [cards, currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    if (done || !flipped || cards.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1') handleReview(1);
      else if (e.key === '2') handleReview(2);
      else if (e.key === '3') handleReview(3);
      else if (e.key === '4') handleReview(5);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, done, cards.length, handleReview]);

  // Completion stats
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '0';
  const hardCount = ratings.filter(r => r <= 2).length;
  const easyCount = ratings.filter(r => r >= 4).length;

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>;
  if (cards.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
      <Check size={48} className="mx-auto mb-4 text-[var(--ws-verdigris)]" strokeWidth={1} />
      <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhuma carta para revisar agora</p>
      <button onClick={onBack} className="mt-4 text-sm text-[var(--ws-accent)] hover:underline">Voltar</button>
    </motion.div>
  );
  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md py-16 text-center">
      <EnsoCircle size={80} strokeWidth={2} color="var(--ws-verdigris)" imperfection={0.1} animate={false} />
      <h2 className="mt-6 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">Sessao Completa!</h2>
      <p className="mt-2 text-sm text-[var(--ws-text-tertiary)]">Voce revisou {reviewed} cartas</p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <WabiSabiCard hover={false}>
          <p className="font-serif-jp text-xl font-bold text-[var(--ws-accent)]">{avgRating}</p>
          <p className="mt-1 text-[10px] text-[var(--ws-text-tertiary)]">Media</p>
        </WabiSabiCard>
        <WabiSabiCard hover={false}>
          <p className="font-serif-jp text-xl font-bold text-[var(--ws-gold)]">{hardCount}</p>
          <p className="mt-1 text-[10px] text-[var(--ws-text-tertiary)]">Dificeis</p>
        </WabiSabiCard>
        <WabiSabiCard hover={false}>
          <p className="font-serif-jp text-xl font-bold text-[var(--ws-verdigris)]">{easyCount}</p>
          <p className="mt-1 text-[10px] text-[var(--ws-text-tertiary)]">Faceis</p>
        </WabiSabiCard>
      </div>

      <ZenButton variant="primary" size="md" className="mt-8" onClick={onBack}>Voltar aos Flashcards</ZenButton>
    </motion.div>
  );

  const card = cards[currentIndex];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Progress header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-3">
            <span className="font-serif-jp text-sm font-bold text-[var(--ws-text-primary)]">{currentIndex + 1} <span className="font-normal text-[var(--ws-text-tertiary)]">de {cards.length}</span></span>
            <span className="rounded-ws-button bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--ws-accent)]">{reviewed} revisadas</span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--ws-glass-border)]">
          <motion.div className="h-1.5 rounded-full bg-[var(--ws-accent)]" initial={{ width: 0 }} animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <div className="mx-auto max-w-xl">
        {/* Flashcard */}
        <div
          className="perspective-1000 cursor-pointer"
          onClick={() => !flipped && setFlipped(true)}
          style={{ perspective: 1000 }}
        >
          <motion.div className="min-h-[280px] relative" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 100 }} style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-8 backdrop-blur-xl" style={{ backfaceVisibility: 'hidden' }}>
              <p className="mb-4 text-xs font-medium text-[var(--ws-accent)]">PERGUNTA</p>
              <p className="text-center text-lg font-medium leading-relaxed text-[var(--ws-text-primary)]">{card.front}</p>
              <p className="mt-6 text-xs text-[var(--ws-text-tertiary)]">Clique para ver a resposta</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-ws-organic border border-[var(--ws-accent)]/20 bg-[var(--ws-bg)] p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <p className="mb-4 text-xs font-medium text-[var(--ws-verdigris)]">RESPOSTA</p>
              <p className="text-center text-base leading-relaxed text-[var(--ws-text-primary)]">{card.back}</p>
            </div>
          </motion.div>
        </div>

        {/* Rating Buttons */}
        {flipped && (
          <div className="mt-8">
            <p className="mb-3 text-center text-xs text-[var(--ws-text-tertiary)]">Como voce se saiu? (teclas 1-4)</p>
            <div className="flex flex-wrap justify-center gap-3">
              {([
                ['Novamente', '1 min', 1, '1'],
                ['Dificil', '6 min', 2, '2'],
                ['Bom', '10 min', 3, '3'],
                ['Facil', '4 dias', 5, '4'],
              ] as const).map(([label, sub, q, key]) => (
                <button
                  key={label}
                  onClick={() => handleReview(q)}
                  className="group flex flex-col items-center gap-1 rounded-ws-button border border-[var(--ws-glass-border)] px-5 py-3 transition-all hover:border-[var(--ws-accent)]/30 hover:shadow-md"
                >
                  <span className="text-sm font-medium text-[var(--ws-text-primary)]">{label}</span>
                  <span className="text-[10px] text-[var(--ws-text-tertiary)]">{sub}</span>
                  <span className="mt-1 rounded bg-[var(--ws-bg)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--ws-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100">{key}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ========== POMODORO TIMER ==========
function PomodoroTimer() {
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalToday, setTotalToday] = useState(0);
  const [sessions, setSessions] = useState<{ duration: number; createdAt: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const modeLabels = { focus: 'Foco', short: 'Pausa Curta', long: 'Pausa Longa' };
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/sessions').then(r => r.json()).then(d => {
      if (d.sessions) {
        const today = new Date().toDateString();
        setTotalToday(d.sessions.filter((s: any) => new Date(s.createdAt).toDateString() === today).reduce((sum: number, s: any) => sum + s.duration, 0));
        setSessions(d.sessions.slice(0, 10));
      }
    });
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === 'focus') {
              const dur = durations.focus - prev;
              fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration: dur, type: 'pomodoro' }) });
              setTotalToday(t => t + dur);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, durations.focus]);

  const switchMode = (m: 'focus' | 'short' | 'long') => { setMode(m); setTimeLeft(durations[m]); setIsRunning(false); };
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / durations[mode];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl"><Timer size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Pomodoro Timer</h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Estude com foco usando a tecnica Pomodoro</p>
      </div>
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center gap-2">
          {(['focus', 'short', 'long'] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)} className={`rounded-ws-button px-4 py-2 text-sm font-medium transition-colors ${mode === m ? 'bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)]' : 'border border-[var(--ws-glass-border)] text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'}`}>
              {modeLabels[m]}
            </button>
          ))}
        </div>
        <WabiSabiCard className="mb-8" hover={false}>
          <div className="flex flex-col items-center py-8">
            <div className="relative flex h-56 w-56 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--ws-glass-border)" strokeWidth="4" />
                <motion.circle cx="100" cy="100" r="90" fill="none" stroke="var(--ws-accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 90} initial={{ strokeDashoffset: 2 * Math.PI * 90 }} animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress) }} transition={{ duration: 0.5 }} />
              </svg>
              <div className="text-center">
                <p className="font-serif-jp text-5xl font-bold text-[var(--ws-text-primary)]">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
                <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">{modeLabels[mode]}</p>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={() => switchMode(mode)} className="rounded-ws-button p-3 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-text-primary)]" title="Reiniciar"><RotateCcw size={18} /></button>
              <ZenButton variant="primary" size="lg" onClick={() => setIsRunning(!isRunning)} className="px-12">{isRunning ? 'Pausar' : 'Iniciar'}</ZenButton>
            </div>
          </div>
        </WabiSabiCard>
        <WabiSabiCard hover={false}>
          <h3 className="mb-3 text-sm font-semibold text-[var(--ws-text-secondary)]"><Clock size={14} className="mr-1.5 inline" /> Hoje</h3>
          <p className="font-serif-jp text-3xl font-bold text-[var(--ws-text-primary)]">{Math.round(totalToday / 60)} min</p>
          <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">de tempo de foco</p>
          {sessions.length > 0 && (
            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto border-t border-[var(--ws-glass-border)] pt-4">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ws-text-tertiary)]">{new Date(s.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-medium text-[var(--ws-text-primary)]">{Math.round(s.duration / 60)} min</span>
                </div>
              ))}
            </div>
          )}
        </WabiSabiCard>
      </div>
    </motion.div>
  );
}

// ========== SENSEI AI CHAT ==========
function SenseiChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notebooks, setNotebooks] = useState<{ id: string; title: string; content: string }[]>([]);
  const [wisdom, setWisdom] = useState<{ level: number; title: string; emoji: string; memoriesCount: number; nextLevel: { title: string; emoji: string; min: number } | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchedRef = useRef(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch chat history, notebooks and memories on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    Promise.all([
      fetch('/api/chat').then(r => r.json()),
      fetch('/api/notebooks').then(r => r.json()),
      fetch('/api/memories').then(r => r.json()).catch(() => ({ count: 0 })),
    ]).then(([chatData, nbData, memData]) => {
      if (nbData.notebooks) setNotebooks(nbData.notebooks);
      if (memData?.count) {
        const levels = [{min:0,t:'Aprendiz',e:'🌱'},{min:3,t:'Discipulo',e:'🌿'},{min:8,t:'Guardiao',e:'🌳'},{min:15,t:'Sabio',e:'🏛️'},{min:25,t:'Mestre',e:'🧙'},{min:40,t:'Dragao',e:'🐉'},{min:60,t:'Vidente',e:'👁️'},{min:80,t:'Iluminado',e:'🌟'},{min:100,t:'Transcendente',e:'🌌'},{min:150,t:'Infinito',e:'♾️'}];
        let lvl = levels[0]; let nxt = null;
        for (const l of levels) { if (memData.count >= l.min) lvl = l; }
        nxt = levels.find(l => l.min > memData.count) || null;
        setWisdom({ level: lvl.min, title: lvl.t, emoji: lvl.e, memoriesCount: memData.count, nextLevel: nxt ? { title: nxt.t, emoji: nxt.e, min: nxt.min } : null });
      }
      if (chatData.messages && chatData.messages.length > 0) {
        setMessages(chatData.messages);
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Ola! Sou o **Sensei AI** — seu assistente inteligente. Posso te ajudar com **qualquer assunto**: estudos, programacao, matematica, escrita, ideias, analises, ou so conversar.

Quanto mais voce conversa comigo, mais eu aprendo sobre voce e mais personalizadas ficam minhas respostas.

*Escolha uma sugestao abaixo ou me pergunte qualquer coisa!*`,
          createdAt: new Date().toISOString(),
        }]);
      }
    }).catch(() => {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Ola! Sou o **Sensei AI**. Posso te ajudar com qualquer assunto.

*Como posso ajudar?*`,
        createdAt: new Date().toISOString(),
      }]);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (msgText?: string) => {
    const userMsg = (msgText || input).trim();
    if (!userMsg || isLoading) return;
    const userMessage = { id: Date.now().toString(), role: 'user', content: userMsg, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/sensei-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) });
      const data = await res.json();

      // Handle usage limit
      if (data.code === 'USAGE_LIMIT') {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant', content: `Voce atingiu seu **limite diario de ${data.usage.limit} mensagens**.

Upgrade para **Premium** e converse ilimitadamente com o Sensei AI!`, createdAt: new Date().toISOString(),
        }]);
        setIsLoading(false);
        return;
      }

      const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.wisdom) setWisdom(data.wisdom);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
        createdAt: new Date().toISOString(),
      }]);
    }
    setIsLoading(false);
  };

  const handleClear = async () => {
    if (!confirm('Limpar toda a conversa?')) return;
    try {
      await fetch('/api/chat', { method: 'DELETE' });
    } catch {}
    setMessages([{
      id: 'welcome-clear',
      role: 'assistant',
      content: `Conversa limpa! Ainda tenho acesso aos seus cadernos.

*Como posso ajudar?*`,
      createdAt: new Date().toISOString(),
    }]);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOnlyWelcome = messages.length <= 1;

  // Build dynamic suggestions from notebooks
  const notebookSuggestions = notebooks
    .filter(nb => nb.content && nb.content.replace(/<[^>]*>/g, '').trim().length > 20)
    .slice(0, 3);

  const defaultSuggestions = [
    { category: 'Pergunte qualquer coisa', icon: Sparkles, prompts: ['Me explique como funciona a inteligencia artificial', 'Qual a diferenca entre React e Vue?', 'Como funciona o mercado de acoes?'] },
    { category: 'Estudos e Aprendizado', icon: BookOpen, prompts: ['Como estudar de forma mais eficiente?', 'Crie um plano de estudos para mim', 'Me ajude a entender um conceito dificil'] },
    { category: 'Programacao e Tecnologia', icon: Zap, prompts: ['Me ajude a debuggar um codigo', 'Explique um conceito de programacao', 'Boas praticas de desenvolvimento'] },
    { category: 'Criatividade e Escrita', icon: Star, prompts: ['Me ajude a escrever um texto', 'Ideias para um projeto criativo', 'Me ajude a brainstormizar ideias'] },
    { category: 'Produtividade', icon: Target, prompts: ['Como manter o foco', 'Me ajude a organizar minha rotina', 'Tecnicas de gestao de tempo'] },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
            <MessageCircle size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Sensei IA
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {wisdom && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-500">
                <span className="text-sm">{wisdom.emoji}</span> {wisdom.title}
                <span className="text-[10px] font-normal text-amber-400/70">({wisdom.memoriesCount} memorias)</span>
              </span>
            )}
            {notebooks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ws-verdigris)]/30 bg-[color-mix(in_srgb,var(--ws-verdigris)_8%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--ws-verdigris)]">
                <Sparkles size={10} /> {notebooks.length} caderno{notebooks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-ws-button border border-[var(--ws-glass-border)] px-3 py-2 text-xs text-[var(--ws-text-tertiary)] transition-colors hover:border-red-300/50 hover:text-red-400"
          >
            <Trash size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] shadow-[var(--ws-shadow-medium)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[var(--ws-glass-border)] px-6 py-4">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-lg">
            {wisdom?.emoji || '🌱'}
            {isLoading && <div className="absolute -top-0.5 -right-0.5 h-3 w-3"><div className="h-full w-full animate-ping rounded-full bg-green-400" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif-jp text-sm font-bold text-[var(--ws-text-primary)]">Sensei AI {wisdom ? wisdom.title : ''}</h3>
            </div>
            {wisdom && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--ws-glass-border)]">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min((wisdom.memoriesCount / 150) * 100, 100)}%` }} />
                </div>
                <span className="text-[9px] text-[var(--ws-text-tertiary)]">
                  {wisdom.nextLevel ? `${wisdom.memoriesCount}/${wisdom.nextLevel.min} ${wisdom.nextLevel.emoji} ${wisdom.nextLevel.title}` : 'Nivel maximo!'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--ws-verdigris)]" />
            <span className="text-xs text-[var(--ws-text-tertiary)]">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-[500px] overflow-y-auto p-6">
          <div className="space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && <EnsoCircle size={28} strokeWidth={1.5} color="var(--ws-accent)" imperfection={0.08} animate={false} />}
                  <div className="flex flex-col">
                    <div className={`group relative max-w-[85%] rounded-ws-organic px-5 py-3 ${msg.role === 'user' ? 'bg-[var(--ws-ink)] text-[var(--ws-text-on-dark)]' : 'border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] text-[var(--ws-text-primary)]'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="markdown-content text-sm leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      )}
                      {/* Copy button on assistant messages */}
                      {msg.role === 'assistant' && msg.id !== 'welcome' && msg.id !== 'welcome-clear' && (
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="absolute right-2 top-2 rounded-md p-1.5 text-[var(--ws-text-tertiary)] opacity-0 transition-all hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] hover:text-[var(--ws-accent)] group-hover:opacity-100"
                          title={copiedId === msg.id ? 'Copiado!' : 'Copiar resposta'}
                        >
                          {copiedId === msg.id ? <Check size={12} className="text-[var(--ws-verdigris)]" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                    <span className={`mt-1 text-[10px] text-[var(--ws-text-tertiary)] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}

            {/* Loading animation */}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <EnsoCircle size={28} strokeWidth={1.5} color="var(--ws-accent)" imperfection={0.08} animate={false} />
                <div className="flex items-center gap-1.5 rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <motion.div className="h-2 w-2 rounded-full bg-[var(--ws-accent)]" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                    <motion.div className="h-2 w-2 rounded-full bg-[var(--ws-accent)]" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                    <motion.div className="h-2 w-2 rounded-full bg-[var(--ws-accent)]" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                  </div>
                  <span className="ml-2 text-[10px] text-[var(--ws-text-tertiary)]">Sensei esta pensando...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Suggested prompts */}
          {isOnlyWelcome && !isLoading && (
            <div className="mt-6 space-y-4">
              {/* Dynamic suggestions from user notebooks */}
              {notebookSuggestions.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[var(--ws-accent)]" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ws-text-tertiary)]">Baseado nos seus cadernos</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notebookSuggestions.map(nb => (
                      <button key={nb.id} onClick={() => handleSend(`Me ajude a revisar o conteudo do caderno "${nb.title}". Me faca um resumo e me faca perguntas para testar meu conhecimento.`)} className="rounded-full border border-[var(--ws-accent)]/20 bg-[color-mix(in_srgb,var(--ws-accent)_6%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_12%,transparent)]">
                        Revisar: {nb.title}
                      </button>
                    ))}
                    {notebookSuggestions.length > 0 && (
                      <button onClick={() => handleSend('O que eu tenho estudado ultimamente? Me faca um resumo de todos os meus cadernos e sugira o que revisar primeiro.')} className="rounded-full border border-[var(--ws-glass-border)] px-3 py-1.5 text-xs text-[var(--ws-text-secondary)] transition-colors hover:border-[var(--ws-accent)]/30 hover:bg-[color-mix(in_srgb,var(--ws-accent)_5%,transparent)]">
                        Resumo geral dos estudos
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Default suggestions */}
              {defaultSuggestions.map((cat) => (
                <div key={cat.category}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <cat.icon size={12} className="text-[var(--ws-accent)]" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ws-text-tertiary)]">{cat.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.prompts.map(p => (
                      <button key={p} onClick={() => handleSend(p)} className="rounded-full border border-[var(--ws-glass-border)] px-3 py-1.5 text-xs text-[var(--ws-text-secondary)] transition-colors hover:border-[var(--ws-accent)]/30 hover:bg-[color-mix(in_srgb,var(--ws-accent)_5%,transparent)]">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input - textarea for multi-line */}
        <div className="border-t border-[var(--ws-glass-border)] p-4">
          <div className="flex items-end gap-3 rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3">
            <textarea
              ref={textareaRef}
              placeholder="Pergunte qualquer coisa... (Shift+Enter para nova linha)"
              className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)] transition-colors hover:bg-[var(--ws-accent-hover)] disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--ws-text-tertiary)]">
            {wisdom && wisdom.nextLevel
              ? `${wisdom.emoji} ${wisdom.title} — converse mais ${wisdom.nextLevel.min - wisdom.memoriesCount} vezes para virar ${wisdom.nextLevel.emoji} ${wisdom.nextLevel.title}`
              : wisdom ? `${wisdom.emoji} ${wisdom.title} — Voce alcancou a sabedoria maxima!`
              : 'O Sensei IA evolui com cada conversa — comece a perguntar!'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
