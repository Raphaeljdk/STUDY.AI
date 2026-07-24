'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, BarChart3, MessageCircle, Clock,
  LogOut, Shield, ChevronRight, Star,
  Plus, Trash2, Edit3, X, Timer, RotateCcw,
  Check, AlertCircle, Loader2, BookPlus, FolderOpen, Zap, ArrowLeft
} from 'lucide-react';
import { WabiSabiCard } from './WabiSabiCard';
import { ZenButton } from './ZenButton';
import { EnsoCircle } from './EnsoCircle';
import { AIChatPanel } from './AIChatPanel';
import { AdminPanel } from './AdminPanel';

const planLabels: Record<string, string> = { FREE: 'Shojin', SAMURAI: 'Samurai', SENSEI: 'Sensei' };
const planColors: Record<string, string> = { FREE: 'var(--ws-text-tertiary)', SAMURAI: 'var(--ws-accent)', SENSEI: 'var(--ws-gold)' };

const notebookColors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#f39c12'];

type Tab = 'dashboard' | 'notebooks' | 'notebook-edit' | 'flashcards' | 'flashcard-review' | 'timer' | 'chat' | 'admin';

interface NotebookItem {
  id: string;
  title: string;
  content: string;
  color: string;
  _count?: { flashcards: number };
  updatedAt: string;
  flashcards?: FlashcardItem[];
}

interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  notebookId: string | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

interface Stats {
  notebooks: number;
  flashcards: number;
  dueFlashcards: number;
  studyTime: string;
}

// ========== MAIN DASHBOARD VIEW ==========
export function DashboardView() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editNotebookId, setEditNotebookId] = useState<string | null>(null);

  const openNotebook = (id: string) => {
    if (!id) {
      setActiveTab('notebooks');
      return;
    }
    setEditNotebookId(id);
    setActiveTab('notebook-edit');
  };

  const goToFlashcardReview = () => setActiveTab('flashcard-review');
  const goToTimer = () => setActiveTab('timer');
  const goToChat = () => setActiveTab('chat');

  return (
    <div className="min-h-screen bg-[var(--ws-bg)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 lg:px-24">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (activeTab !== 'dashboard') setActiveTab('dashboard'); }} className="flex items-center gap-3">
              <EnsoCircle size={32} strokeWidth={2} color="var(--ws-accent)" imperfection={0.1} animate={false} />
              <span className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">StudyAI</span>
            </button>
          </div>

          {/* Tabs */}
          <nav className="hidden items-center gap-1 md:flex">
            <TabBtn icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabBtn icon={BookOpen} label="Cadernos" active={activeTab === 'notebooks' || activeTab === 'notebook-edit'} onClick={() => setActiveTab('notebooks')} />
            <TabBtn icon={Brain} label="Flashcards" active={activeTab === 'flashcards' || activeTab === 'flashcard-review'} onClick={() => setActiveTab('flashcards')} />
            <TabBtn icon={Timer} label="Pomodoro" active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} />
            <TabBtn icon={MessageCircle} label="Sensei IA" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
          </nav>

          {/* User Info + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--ws-text-primary)]">{user?.name}</p>
              <p className="text-xs" style={{ color: planColors[user?.plan] || 'var(--ws-text-tertiary)' }}>
                {planLabels[user?.plan] || 'Free'}{isAdmin && ' · Admin'}
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--ws-glass-border)] font-serif-jp text-sm font-bold text-[var(--ws-accent)]">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Tabs - scrollable */}
        <div className="flex overflow-x-auto md:hidden no-scrollbar">
          <TabBtn icon={BarChart3} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabBtn icon={BookOpen} label="Cadernos" active={activeTab === 'notebooks' || activeTab === 'notebook-edit'} onClick={() => setActiveTab('notebooks')} />
          <TabBtn icon={Brain} label="Cards" active={activeTab === 'flashcards' || activeTab === 'flashcard-review'} onClick={() => setActiveTab('flashcards')} />
          <TabBtn icon={Timer} label="Timer" active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} />
          <TabBtn icon={MessageCircle} label="Sensei" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-24 lg:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardHome key="home" user={user} openNotebook={openNotebook} goToFlashcardReview={goToFlashcardReview} goToTimer={goToTimer} goToChat={goToChat} />}
          {activeTab === 'notebooks' && <NotebooksList key="notebooks" onOpen={openNotebook} />}
          {activeTab === 'notebook-edit' && editNotebookId && <NotebookEditor key={editNotebookId} notebookId={editNotebookId} onBack={() => setActiveTab('notebooks')} />}
          {activeTab === 'flashcards' && <FlashcardsManager key="flashcards" onReview={goToFlashcardReview} />}
          {activeTab === 'flashcard-review' && <FlashcardReviewer key="review" onBack={() => setActiveTab('flashcards')} />}
          {activeTab === 'timer' && <PomodoroTimer key="timer" />}
          {activeTab === 'chat' && <AIChatPanel key="chat" />}
          {activeTab === 'admin' && isAdmin && <AdminPanel key="admin" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ========== TAB BUTTON ==========
function TabBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'text-[var(--ws-accent)]'
          : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'
      }`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--ws-accent)]" />}
    </button>
  );
}

// ========== DASHBOARD HOME ==========
function DashboardHome({ user, openNotebook, goToFlashcardReview, goToTimer, goToChat }: { user: any; openNotebook: (id: string) => void; goToFlashcardReview: () => void; goToTimer: () => void; goToChat: () => void }) {
  const [stats, setStats] = useState<Stats>({ notebooks: 0, flashcards: 0, dueFlashcards: 0, studyTime: '0m' });
  const [recentNotebooks, setRecentNotebooks] = useState<NotebookItem[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.notebooks !== undefined) setStats(d); });
    fetch('/api/notebooks').then(r => r.json()).then(d => { if (d.notebooks) setRecentNotebooks(d.notebooks.slice(0, 3)); });
  }, []);

  const cards = [
    { Icon: BookOpen, title: 'Meus Cadernos', value: String(stats.notebooks), desc: 'Cadernos ativos', action: () => openNotebook('') },
    { Icon: Brain, title: 'Flashcards', value: String(stats.dueFlashcards), desc: 'Cartas para revisar', action: goToFlashcardReview },
    { Icon: Clock, title: 'Horas Estudadas', value: stats.studyTime, desc: 'Esta semana', action: goToTimer },
    { Icon: MessageCircle, title: 'Mensagens IA', value: '0', desc: 'Conversas com Sensei', action: goToChat },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
          Konnichiwa, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
          Cada dia de estudo e um passo no caminho do conhecimento.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <button onClick={card.action} className="w-full text-left">
              <WabiSabiCard>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                    <card.Icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
                  </div>
                  <ChevronRight size={16} className="text-[var(--ws-text-tertiary)]" />
                </div>
                <p className="mt-4 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">{card.value}</p>
                <p className="mt-1 text-sm font-medium text-[var(--ws-text-secondary)]">{card.title}</p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">{card.desc}</p>
              </WabiSabiCard>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Plan Card */}
      <WabiSabiCard className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[var(--ws-gold)]" fill="var(--ws-gold)" />
              <span className="text-sm font-semibold text-[var(--ws-text-primary)]">Plano Atual</span>
            </div>
            <p className="mt-1 font-serif-jp text-xl font-bold" style={{ color: planColors[user?.plan] || 'var(--ws-text-tertiary)' }}>
              {planLabels[user?.plan] || 'Free'}
            </p>
            <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">
              {user?.plan === 'FREE' && 'Faca upgrade para desbloquear todos os recursos'}
              {user?.plan === 'SAMURAI' && 'Acesso completo a IA e ferramentas avancadas'}
              {user?.plan === 'SENSEI' && 'Acesso maximo + tutoria personalizada e comunidade exclusiva'}
            </p>
          </div>
        </div>
      </WabiSabiCard>

      {/* Quick Access */}
      <h2 className="mb-4 font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Acesso Rapido</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => openNotebook('')} className="w-full text-left">
          <WabiSabiCard hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                <BookOpen size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">Abrir Caderno</p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">Continue de onde parou</p>
              </div>
              <ChevronRight size={16} className="text-[var(--ws-text-tertiary)]" />
            </div>
          </WabiSabiCard>
        </button>
        <button onClick={goToFlashcardReview} className="w-full text-left">
          <WabiSabiCard hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                <Brain size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">Revisar Flashcards</p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">{stats.dueFlashcards > 0 ? `${stats.dueFlashcards} cartas para revisar` : 'Nenhuma carta pendente'}</p>
              </div>
              <ChevronRight size={16} className="text-[var(--ws-text-tertiary)]" />
            </div>
          </WabiSabiCard>
        </button>
        <button onClick={goToChat} className="w-full text-left">
          <WabiSabiCard hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                <MessageCircle size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">Perguntar ao Sensei</p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">Tire duvidas com IA</p>
              </div>
              <ChevronRight size={16} className="text-[var(--ws-text-tertiary)]" />
            </div>
          </WabiSabiCard>
        </button>
      </div>

      {/* Recent Notebooks */}
      {recentNotebooks.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Cadernos Recentes</h2>
            <button onClick={() => openNotebook('')} className="text-xs font-medium text-[var(--ws-accent)] hover:underline">Ver todos</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentNotebooks.map(nb => (
              <button key={nb.id} onClick={() => openNotebook(nb.id)} className="w-full text-left">
                <WabiSabiCard hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: nb.color + '18' }}>
                      <BookOpen size={18} style={{ color: nb.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--ws-text-primary)]">{nb.title}</p>
                      <p className="text-xs text-[var(--ws-text-tertiary)]">{nb._count?.flashcards || 0} flashcards</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                  </div>
                </WabiSabiCard>
              </button>
            ))}
          </div>
        </div>
      )}
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
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/notebooks')
      .then(r => r.json())
      .then(data => { if (data.notebooks) setNotebooks(data.notebooks); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, color: newColor }),
      });
      const data = await res.json();
      if (data.notebook) {
        setNotebooks(prev => [data.notebook, ...prev]);
        setNewTitle('');
        setCreating(false);
        onOpen(data.notebook.id);
      }
    } catch { setMsg({ type: 'error', text: 'Erro ao criar caderno' }); }
    setCreating(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deletar o caderno "${title}"?`)) return;
    try {
      await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
      setNotebooks(prev => prev.filter(n => n.id !== id));
    } catch { setMsg({ type: 'error', text: 'Erro ao deletar' }); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
          Meus Cadernos
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Organize seus estudos por assunto</p>
      </div>

      {msg && (
        <div className={`mb-4 rounded-ws-button px-4 py-2.5 text-sm ${
          msg.type === 'success' ? 'bg-[color-mix(in_srgb,var(--ws-verdigris)_12%,transparent)] text-[var(--ws-verdigris)]' : 'bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] text-[var(--ws-accent)]'
        }`}>{msg.text}</div>
      )}

      {/* Create form */}
      <WabiSabiCard className="mb-8" hover={false}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Novo Caderno</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Ex: Matematica, Historia, Biologia..."
              className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Cor</label>
            <div className="flex gap-2">
              {notebookColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${newColor === c ? 'scale-110 border-[var(--ws-text-primary)]' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <ZenButton type="submit" variant="primary" size="md" disabled={creating || !newTitle.trim()}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
          </ZenButton>
        </form>
      </WabiSabiCard>

      {/* Notebook grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>
      ) : notebooks.length === 0 ? (
        <div className="py-16 text-center">
          <FolderOpen size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum caderno criado ainda</p>
          <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">Crie seu primeiro caderno acima para comecar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((nb, i) => (
            <motion.div
              key={nb.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
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
                  {nb.content && (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ws-text-tertiary)]">{nb.content.substring(0, 120)}</p>
                  )}
                  <p className="mt-2 text-[10px] text-[var(--ws-text-tertiary)]">
                    {new Date(nb.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </button>
                <div className="mt-3 flex justify-end border-t border-[var(--ws-glass-border)] pt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(nb.id, nb.title); }}
                    className="rounded-ws-button p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] hover:text-[var(--ws-accent)]"
                    title="Deletar"
                  >
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

// ========== NOTEBOOK EDITOR ==========
function NotebookEditor({ notebookId, onBack }: { notebookId: string; onBack: () => void }) {
  const [notebook, setNotebook] = useState<NotebookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [editTitle, setEditTitle] = useState(false);
  const [showFlashcardForm, setShowFlashcardForm] = useState(false);
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');
  const [creatingFc, setCreatingFc] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/notebooks/${notebookId}`)
      .then(r => r.json())
      .then(d => {
        if (d.notebook) {
          setNotebook(d.notebook);
          setTitle(d.notebook.title);
          setContent(d.notebook.content);
        }
      })
      .finally(() => setLoading(false));
  }, [notebookId]);

  const saveContent = useCallback(async (newContent: string, newTitle?: string) => {
    setSaving(true);
    try {
      const data: any = { content: newContent };
      if (newTitle !== undefined) data.title = newTitle;
      const res = await fetch(`/api/notebooks/${notebookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (d.notebook) setNotebook(d.notebook);
    } catch { /* ignore */ }
    setSaving(false);
  }, [notebookId]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveContent(val), 1000);
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      saveContent(content, title.trim());
      setEditTitle(false);
    }
  };

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcFront.trim() || !fcBack.trim()) return;
    setCreatingFc(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: fcFront, back: fcBack, notebookId }),
      });
      const data = await res.json();
      if (data.flashcard) {
        setNotebook(prev => prev ? { ...prev, flashcards: [data.flashcard, ...(prev.flashcards || [])] } : prev);
        setFcFront('');
        setFcBack('');
        setShowFlashcardForm(false);
      }
    } catch { /* ignore */ }
    setCreatingFc(false);
  };

  const handleDeleteFlashcard = async (fcId: string) => {
    try {
      await fetch(`/api/flashcards/${fcId}`, { method: 'DELETE' });
      setNotebook(prev => prev ? { ...prev, flashcards: prev.flashcards?.filter(f => f.id !== fcId) || [] } : prev);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="py-16 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
        <p className="text-sm text-[var(--ws-text-tertiary)]">Caderno nao encontrado</p>
        <button onClick={onBack} className="mt-4 text-sm text-[var(--ws-accent)] hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-text-primary)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          {editTitle ? (
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)] bg-transparent border-b border-[var(--ws-accent)]/30 outline-none"
            />
          ) : (
            <button onClick={() => setEditTitle(true)} className="flex items-center gap-2 group">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: notebook.color }} />
              <h1 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)] lg:text-2xl group-hover:text-[var(--ws-accent)] transition-colors">{notebook.title}</h1>
              <Edit3 size={14} className="text-[var(--ws-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        {saving && <Loader2 size={14} className="animate-spin text-[var(--ws-text-tertiary)]" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Editor */}
        <WabiSabiCard className="min-h-[500px]" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]">
              <Edit3 size={14} className="mr-1.5 inline" /> Suas Anotacoes
            </h2>
            <span className="text-[10px] text-[var(--ws-text-tertiary)]">Salva automaticamente</span>
          </div>
          <textarea
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Comece a escrever suas anotacoes aqui...&#10;&#10;Dicas:&#10;- Organize por topicos&#10;- Use linhas em branco para separar ideias&#10;- Destaque termos importantes&#10;- Resuma com suas proprias palavras"
            className="h-full min-h-[400px] w-full resize-none bg-transparent font-serif-jp text-sm leading-relaxed text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none"
          />
        </WabiSabiCard>

        {/* Sidebar - Flashcards for this notebook */}
        <div className="space-y-4">
          <WabiSabiCard hover={false}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--ws-text-secondary)]">
                <Brain size={14} className="mr-1.5 inline" /> Flashcards
              </h3>
              <button
                onClick={() => setShowFlashcardForm(!showFlashcardForm)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]"
              >
                {showFlashcardForm ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>

            {showFlashcardForm && (
              <form onSubmit={handleCreateFlashcard} className="mt-4 space-y-3 border-t border-[var(--ws-glass-border)] pt-4">
                <input
                  type="text"
                  value={fcFront}
                  onChange={e => setFcFront(e.target.value)}
                  placeholder="Frente (pergunta)"
                  className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30"
                />
                <textarea
                  value={fcBack}
                  onChange={e => setFcBack(e.target.value)}
                  placeholder="Verso (resposta)"
                  rows={3}
                  className="w-full resize-none rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30"
                />
                <ZenButton type="submit" variant="primary" size="sm" className="w-full" disabled={creatingFc || !fcFront.trim() || !fcBack.trim()}>
                  {creatingFc ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar Flashcard
                </ZenButton>
              </form>
            )}

            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {(!notebook.flashcards || notebook.flashcards.length === 0) && !showFlashcardForm && (
                <p className="py-4 text-center text-xs text-[var(--ws-text-tertiary)]">
                  Nenhum flashcard. Crie o primeiro acima.
                </p>
              )}
              {notebook.flashcards?.map(fc => (
                <div key={fc.id} className="rounded-ws-button border border-[var(--ws-glass-border)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--ws-text-primary)]">{fc.front}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[var(--ws-text-tertiary)]">{fc.back}</p>
                    </div>
                    <button onClick={() => handleDeleteFlashcard(fc.id)} className="shrink-0 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-accent)]">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </WabiSabiCard>
        </div>
      </div>
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

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/flashcards')
      .then(r => r.json())
      .then(data => { if (data.flashcards) setFlashcards(data.flashcards); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back }),
      });
      const data = await res.json();
      if (data.flashcard) {
        setFlashcards(prev => [data.flashcard, ...prev]);
        setFront('');
        setBack('');
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/flashcards/${id}`, { method: 'DELETE' });
      setFlashcards(prev => prev.filter(f => f.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
            <Brain size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Flashcards
          </h1>
          <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Crie cartas e revise com spaced repetition</p>
        </div>
        <ZenButton variant="primary" size="md" onClick={onReview}>
          <Zap size={14} /> Revisar
        </ZenButton>
      </div>

      {/* Create form */}
      <WabiSabiCard className="mb-8" hover={false}>
        <button onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-between text-left">
          <h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]">
            <BookPlus size={14} className="mr-1.5 inline" /> {showForm ? 'Fechar' : 'Criar Flashcard'}
          </h2>
          <motion.div animate={{ rotate: showForm ? 45 : 0 }}><Plus size={16} className="text-[var(--ws-text-tertiary)]" /></motion.div>
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreate}
              className="mt-4 space-y-3 overflow-hidden"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Frente (pergunta)</label>
                <input
                  type="text"
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  placeholder="O que e fotossintese?"
                  className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Verso (resposta)</label>
                <textarea
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  placeholder="Processo pelo qual plantas convertem luz em energia..."
                  rows={3}
                  className="w-full resize-none rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30"
                />
              </div>
              <ZenButton type="submit" variant="primary" size="md" className="w-full" disabled={creating || !front.trim() || !back.trim()}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar Flashcard
              </ZenButton>
            </motion.form>
          )}
        </AnimatePresence>
      </WabiSabiCard>

      {/* Flashcards list */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>
      ) : flashcards.length === 0 ? (
        <div className="py-16 text-center">
          <Brain size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum flashcard criado</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flashcards.map((fc, i) => (
            <motion.div
              key={fc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <WabiSabiCard hover={false}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--ws-text-secondary)]">Frente</p>
                    <p className="mt-1 text-sm font-medium text-[var(--ws-text-primary)]">{fc.front}</p>
                    <p className="mt-2 text-xs font-medium text-[var(--ws-text-secondary)]">Verso</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--ws-text-tertiary)]">{fc.back}</p>
                  </div>
                  <button onClick={() => handleDelete(fc.id)} className="shrink-0 p-1 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-accent)]">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--ws-glass-border)] pt-3">
                  <span className="text-[10px] text-[var(--ws-text-tertiary)]">Revisao: {fc.repetitions}x</span>
                  <span className="text-[10px] text-[var(--ws-text-tertiary)]">Intervalo: {fc.interval}d</span>
                </div>
              </WabiSabiCard>
            </motion.div>
          ))}
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

  useEffect(() => {
    fetch('/api/flashcards?due=true')
      .then(r => r.json())
      .then(d => {
        if (d.flashcards) setCards(d.flashcards);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (quality: number) => {
    const card = cards[currentIndex];
    if (!card) return;

    try {
      await fetch(`/api/flashcards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: quality }),
      });
    } catch { /* ignore */ }

    const newReviewed = reviewed + 1;
    setReviewed(newReviewed);
    setFlipped(false);

    if (currentIndex + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>;
  }

  if (cards.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
        <Check size={48} className="mx-auto mb-4 text-[var(--ws-verdigris)]" strokeWidth={1} />
        <p className="text-sm text-[var(--ws-text-tertiary)]">Nenhuma carta para revisar agora</p>
        <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">Volte mais tarde ou crie novos flashcards</p>
        <button onClick={onBack} className="mt-4 text-sm text-[var(--ws-accent)] hover:underline">Voltar</button>
      </motion.div>
    );
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center">
        <EnsoCircle size={80} strokeWidth={2} color="var(--ws-verdigris)" imperfection={0.1} animate={false} />
        <h2 className="mt-6 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">Sessao Completa!</h2>
        <p className="mt-2 text-sm text-[var(--ws-text-tertiary)]">Voce revisou {reviewed} cartas</p>
        <ZenButton variant="primary" size="md" className="mt-6" onClick={onBack}>Voltar aos Flashcards</ZenButton>
      </motion.div>
    );
  }

  const card = cards[currentIndex];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]">
          <ArrowLeft size={16} /> Voltar
        </button>
        <span className="text-xs text-[var(--ws-text-tertiary)]">{currentIndex + 1} de {cards.length}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-1 w-full rounded-full bg-[var(--ws-glass-border)]">
        <motion.div
          className="h-1 rounded-full bg-[var(--ws-accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      <div className="mx-auto max-w-xl">
        <motion.div
          className="perspective-1000 cursor-pointer"
          onClick={() => !flipped && setFlipped(true)}
          style={{ perspective: 1000 }}
        >
          <motion.div
            className="min-h-[280px]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-8 backdrop-blur-xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="mb-4 text-xs font-medium text-[var(--ws-accent)]">PERGUNTA</p>
              <p className="text-center text-lg font-medium leading-relaxed text-[var(--ws-text-primary)]">{card.front}</p>
              <p className="mt-6 text-xs text-[var(--ws-text-tertiary)]">Clique para ver a resposta</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-ws-organic border border-[var(--ws-accent)]/20 bg-[var(--ws-bg)] p-8"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="mb-4 text-xs font-medium text-[var(--ws-verdigris)]">RESPOSTA</p>
              <p className="text-center text-base leading-relaxed text-[var(--ws-text-primary)]">{card.back}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Rating buttons */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <ReviewButton label="Novamente" sub="1 min" quality={1} color="var(--ws-accent)" onClick={() => handleReview(1)} />
              <ReviewButton label="Dificil" sub="6 min" quality={2} color="#d35400" onClick={() => handleReview(2)} />
              <ReviewButton label="Bom" sub="10 min" quality={3} color="#27ae60" onClick={() => handleReview(3)} />
              <ReviewButton label="Facil" sub="4 dias" quality={5} color="var(--ws-verdigris)" onClick={() => handleReview(5)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ReviewButton({ label, sub, quality, color, onClick }: { label: string; sub: string; quality: number; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-ws-button border border-[var(--ws-glass-border)] px-5 py-3 transition-all hover:border-[var(--ws-accent)]/30 hover:shadow-md"
    >
      <span className="text-sm font-medium text-[var(--ws-text-primary)]">{label}</span>
      <span className="text-[10px] text-[var(--ws-text-tertiary)]">{sub}</span>
    </button>
  );
}

// ========== POMODORO TIMER ==========
function PomodoroTimer() {
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<{ duration: number; createdAt: string; type: string }[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const modeLabels = { focus: 'Foco', short: 'Pausa Curta', long: 'Pausa Longa' };

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(d => {
      if (d.sessions) {
        const today = new Date().toDateString();
        const todaySessions = d.sessions.filter((s: any) => new Date(s.createdAt).toDateString() === today);
        setTotalToday(todaySessions.reduce((sum: number, s: any) => sum + s.duration, 0));
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
              // Save session
              const duration = durations.focus - prev;
              fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration, type: 'pomodoro' }),
              });
              setTotalToday(t => t + duration);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, durations.focus]);

  const switchMode = (m: 'focus' | 'short' | 'long') => {
    setMode(m);
    setTimeLeft(durations[m]);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / durations[mode];
  const totalTimeMin = Math.round(totalToday / 60);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
          <Timer size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Pomodoro Timer
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Estude com foco usando a tecnica Pomodoro</p>
      </div>

      <div className="mx-auto max-w-md">
        {/* Mode selector */}
        <div className="mb-8 flex justify-center gap-2">
          {(['focus', 'short', 'long'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-ws-button px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)]'
                  : 'border border-[var(--ws-glass-border)] text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <WabiSabiCard className="mb-8" hover={false}>
          <div className="flex flex-col items-center py-8">
            <div className="relative flex h-56 w-56 items-center justify-center">
              {/* Progress ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--ws-glass-border)" strokeWidth="4" />
                <motion.circle
                  cx="100" cy="100" r="90" fill="none" stroke="var(--ws-accent)" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 90}
                  animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress) }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="text-center">
                <p className="font-serif-jp text-5xl font-bold text-[var(--ws-text-primary)]">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
                <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">{modeLabels[mode]}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => switchMode(mode)}
                className="rounded-ws-button p-3 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-text-primary)]"
                title="Reiniciar"
              >
                <RotateCcw size={18} />
              </button>
              <ZenButton
                variant="primary"
                size="lg"
                onClick={() => setIsRunning(!isRunning)}
                className="px-12"
              >
                {isRunning ? 'Pausar' : 'Iniciar'}
              </ZenButton>
            </div>
          </div>
        </WabiSabiCard>

        {/* Today's stats */}
        <WabiSabiCard hover={false}>
          <h3 className="mb-3 text-sm font-semibold text-[var(--ws-text-secondary)]">
            <Clock size={14} className="mr-1.5 inline" /> Hoje
          </h3>
          <p className="font-serif-jp text-3xl font-bold text-[var(--ws-text-primary)]">{totalTimeMin} min</p>
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
