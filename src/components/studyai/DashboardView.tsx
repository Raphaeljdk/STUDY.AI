'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, BarChart3, MessageCircle, Clock,
  LogOut, Shield, ChevronRight, Star,
  Plus, Trash2, Edit3, X, Timer, RotateCcw,
  Check, AlertCircle, Loader2, BookPlus, FolderOpen, Zap, ArrowLeft,
  Sparkles, TrendingUp, Target, Calendar
} from 'lucide-react';
import { WabiSabiCard } from './WabiSabiCard';
import { ZenButton } from './ZenButton';
import { EnsoCircle } from './EnsoCircle';
import { AdminPanel } from './AdminPanel';
import { RichTextEditor } from './RichTextEditor';

const notebookColors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#f39c12'];

type Tab = 'dashboard' | 'notebooks' | 'notebook-edit' | 'flashcards' | 'flashcard-review' | 'timer' | 'chat' | 'admin';

interface NotebookItem { id: string; title: string; content: string; color: string; _count?: { flashcards: number }; updatedAt: string; flashcards?: FlashcardItem[]; }
interface FlashcardItem { id: string; front: string; back: string; notebookId: string | null; easeFactor: number; interval: number; repetitions: number; nextReview: string; }
interface Stats { notebooks: number; flashcards: number; dueFlashcards: number; studyTime: string; }
interface ChatMsg { id: string; role: string; content: string; createdAt: string; }

// ========== MAIN ==========
export function DashboardView() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editNotebookId, setEditNotebookId] = useState<string | null>(null);

  const openNotebook = (id: string) => {
    if (!id) { setActiveTab('notebooks'); return; }
    setEditNotebookId(id);
    setActiveTab('notebook-edit');
  };

  return (
    <div className="min-h-screen bg-[var(--ws-bg)]">
      <header className="sticky top-0 z-50 border-b border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 lg:px-24">
          <button onClick={() => activeTab !== 'dashboard' && setActiveTab('dashboard')} className="flex items-center gap-3">
            <EnsoCircle size={32} strokeWidth={2} color="var(--ws-accent)" imperfection={0.1} animate={false} />
            <span className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">StudyAI</span>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            <TabBtn icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabBtn icon={BookOpen} label="Cadernos" active={activeTab === 'notebooks' || activeTab === 'notebook-edit'} onClick={() => setActiveTab('notebooks')} />
            <TabBtn icon={Brain} label="Flashcards" active={activeTab === 'flashcards' || activeTab === 'flashcard-review'} onClick={() => setActiveTab('flashcards')} />
            <TabBtn icon={Timer} label="Pomodoro" active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} />
            <TabBtn icon={MessageCircle} label="Sensei IA" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--ws-text-primary)]">{user?.name}</p>
              <p className="text-xs text-[var(--ws-accent)]">Ilimitado{isAdmin && ' · Admin'}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--ws-glass-border)] font-serif-jp text-sm font-bold text-[var(--ws-accent)]">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]" title="Sair"><LogOut size={18} /></button>
          </div>
        </div>
        <div className="flex overflow-x-auto md:hidden no-scrollbar">
          <TabBtn icon={BarChart3} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabBtn icon={BookOpen} label="Cadernos" active={activeTab === 'notebooks' || activeTab === 'notebook-edit'} onClick={() => setActiveTab('notebooks')} />
          <TabBtn icon={Brain} label="Cards" active={activeTab === 'flashcards' || activeTab === 'flashcard-review'} onClick={() => setActiveTab('flashcards')} />
          <TabBtn icon={Timer} label="Timer" active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} />
          <TabBtn icon={MessageCircle} label="Sensei" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-24 lg:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardHome key="home" user={user} openNotebook={openNotebook} />}
          {activeTab === 'notebooks' && <NotebooksList key="nb-list" onOpen={openNotebook} />}
          {activeTab === 'notebook-edit' && editNotebookId && <NotebookEditor key={editNotebookId} notebookId={editNotebookId} onBack={() => setActiveTab('notebooks')} />}
          {activeTab === 'flashcards' && <FlashcardsManager key="fc" />}
          {activeTab === 'flashcard-review' && <FlashcardReviewer key="fcr" onBack={() => setActiveTab('flashcards')} />}
          {activeTab === 'timer' && <PomodoroTimer key="pom" />}
          {activeTab === 'chat' && <SenseiChat key="chat" />}
          {activeTab === 'admin' && isAdmin && <AdminPanel key="adm" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${active ? 'text-[var(--ws-accent)]' : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'}`}>
      <Icon size={16} /><span className="hidden sm:inline">{label}</span>
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--ws-accent)]" />}
    </button>
  );
}

// ========== DASHBOARD HOME ==========
function DashboardHome({ user, openNotebook }: { user: any; openNotebook: (id: string) => void }) {
  const [stats, setStats] = useState<Stats>({ notebooks: 0, flashcards: 0, dueFlashcards: 0, studyTime: '0m' });
  const [recentNBs, setRecentNBs] = useState<NotebookItem[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.notebooks !== undefined) setStats(d); });
    fetch('/api/notebooks').then(r => r.json()).then(d => { if (d.notebooks) setRecentNBs(d.notebooks.slice(0, 3)); });
  }, []);

  const stripHtml = (h: string) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">Konnichiwa, {user?.name?.split(' ')[0]}!</h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Cada dia de estudo e um passo no caminho do conhecimento.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { Icon: BookOpen, title: 'Meus Cadernos', value: String(stats.notebooks), desc: 'Cadernos ativos', action: () => openNotebook('') },
          { Icon: Brain, title: 'Flashcards', value: String(stats.dueFlashcards), desc: 'Cartas para revisar', action: () => {} },
          { Icon: Clock, title: 'Horas Estudadas', value: stats.studyTime, desc: 'Esta semana', action: () => {} },
          { Icon: MessageCircle, title: 'Conversas IA', value: '0', desc: 'Com Sensei', action: () => {} },
        ].map((c, i) => (
          <motion.button key={c.title} onClick={c.action} className="w-full text-left" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <WabiSabiCard>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}><c.Icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} /></div>
                <ChevronRight size={16} className="text-[var(--ws-text-tertiary)]" />
              </div>
              <p className="mt-4 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">{c.value}</p>
              <p className="mt-1 text-sm font-medium text-[var(--ws-text-secondary)]">{c.title}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">{c.desc}</p>
            </WabiSabiCard>
          </motion.button>
        ))}
      </div>

      {/* Unlimited Plan Card */}
      <WabiSabiCard className="mb-8" hover={false}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-gold) 15%, transparent)' }}><Star size={22} className="text-[var(--ws-gold)]" fill="var(--ws-gold)" /></div>
          <div className="flex-1">
            <p className="font-serif-jp text-xl font-bold text-[var(--ws-gold)]">Ilimitado</p>
            <p className="text-xs text-[var(--ws-text-tertiary)]">Cadernos ilimitados · Flashcards ilimitados · Chat IA ilimitado · Pomodoro · Geracao de flashcards com IA · Resumos automaticos</p>
          </div>
        </div>
      </WabiSabiCard>

      {/* Quick Access + Recent */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="mb-4 font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Acesso Rapido</h2>
          <div className="space-y-3">
            {[
              { icon: BookOpen, title: 'Abrir Caderno', desc: 'Continue de onde parou', action: () => openNotebook('') },
              { icon: Brain, title: 'Revisar Flashcards', desc: stats.dueFlashcards > 0 ? `${stats.dueFlashcards} cartas pendentes` : 'Nenhuma carta pendente', action: () => {} },
              { icon: Timer, title: 'Pomodoro Timer', desc: 'Estude com foco', action: () => {} },
              { icon: MessageCircle, title: 'Perguntar ao Sensei', desc: 'Tire duvidas com IA', action: () => {} },
            ].map((a) => (
              <button key={a.title} onClick={a.action} className="w-full text-left">
                <WabiSabiCard hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}><a.icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[var(--ws-text-primary)]">{a.title}</p><p className="text-xs text-[var(--ws-text-tertiary)]">{a.desc}</p></div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                  </div>
                </WabiSabiCard>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Cadernos Recentes</h2>
          {recentNBs.length === 0 ? (
            <WabiSabiCard hover={false}>
              <div className="py-6 text-center"><FolderOpen size={36} className="mx-auto mb-3 text-[var(--ws-text-tertiary)]" strokeWidth={1} /><p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum caderno criado</p><button onClick={() => openNotebook('')} className="mt-2 text-sm font-medium text-[var(--ws-accent)] hover:underline">Criar primeiro caderno</button></div>
            </WabiSabiCard>
          ) : (
            <div className="space-y-3">
              {recentNBs.map(nb => (
                <button key={nb.id} onClick={() => openNotebook(nb.id)} className="w-full text-left">
                  <WabiSabiCard hover={false}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ws-button" style={{ backgroundColor: nb.color + '18' }}><BookOpen size={18} style={{ color: nb.color }} strokeWidth={1.5} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--ws-text-primary)]">{nb.title}</p>
                        <p className="line-clamp-1 text-xs text-[var(--ws-text-tertiary)]">{stripHtml(nb.content).substring(0, 80) || 'Sem conteudo'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-[var(--ws-text-tertiary)]">{nb._count?.flashcards || 0} cards</p>
                        <p className="text-[10px] text-[var(--ws-text-tertiary)]">{new Date(nb.updatedAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </WabiSabiCard>
                </button>
              ))}
            </div>
          )}
        </div>
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
    if (fetchedRef.current) return; fetchedRef.current = true;
    setLoading(true);
    fetch('/api/notebooks').then(r => r.json()).then(d => { if (d.notebooks) setNotebooks(d.notebooks); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle.trim()) return; setCreating(true);
    try {
      const res = await fetch('/api/notebooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, color: newColor }) });
      const data = await res.json();
      if (data.notebook) { setNotebooks(prev => [data.notebook, ...prev]); setNewTitle(''); setCreating(false); onOpen(data.notebook.id); }
    } catch {} setCreating(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deletar "${title}"?`)) return;
    await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
    setNotebooks(prev => prev.filter(n => n.id !== id));
  };

  const stripHtml = (h: string) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8"><h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">Meus Cadernos</h1><p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Organize seus estudos por assunto</p></div>
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
          <ZenButton type="submit" variant="primary" size="md" disabled={creating || !newTitle.trim()}>{creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar</ZenButton>
        </form>
      </WabiSabiCard>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div> : notebooks.length === 0 ? (
        <div className="py-16 text-center"><FolderOpen size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} /><p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum caderno criado ainda</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((nb, i) => (
            <motion.div key={nb.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <WabiSabiCard>
                <button onClick={() => onOpen(nb.id)} className="w-full text-left">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: nb.color + '18' }}><BookOpen size={18} style={{ color: nb.color }} strokeWidth={1.5} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--ws-text-primary)]">{nb.title}</p><p className="text-xs text-[var(--ws-text-tertiary)]">{nb._count?.flashcards || 0} flashcards</p></div></div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--ws-text-tertiary)]" />
                  </div>
                  {nb.content && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ws-text-tertiary)]">{stripHtml(nb.content).substring(0, 120)}</p>}
                  <p className="mt-2 text-[10px] text-[var(--ws-text-tertiary)]">{new Date(nb.updatedAt).toLocaleDateString('pt-BR')}</p>
                </button>
                <div className="mt-3 flex justify-end border-t border-[var(--ws-glass-border)] pt-3"><button onClick={(e) => { e.stopPropagation(); handleDelete(nb.id, nb.title); }} className="rounded-ws-button p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] hover:text-[var(--ws-accent)]" title="Deletar"><Trash2 size={14} /></button></div>
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
  const [showFcForm, setShowFcForm] = useState(false);
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');
  const [creatingFc, setCreatingFc] = useState(false);
  const [generating, setGenerating] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; fetchedRef.current = true;
    fetch(`/api/notebooks/${notebookId}`).then(r => r.json()).then(d => { if (d.notebook) { setNotebook(d.notebook); setTitle(d.notebook.title); setContent(d.notebook.content); } }).catch(() => {}).finally(() => setLoading(false));
  }, [notebookId]);

  const saveContent = useCallback(async (newContent: string, newTitle?: string) => {
    setSaving(true);
    try {
      const data: any = { content: newContent }; if (newTitle !== undefined) data.title = newTitle;
      const res = await fetch(`/api/notebooks/${notebookId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const d = await res.json(); if (d.notebook) setNotebook(d.notebook);
    } catch {} setSaving(false);
  }, [notebookId]);

  const handleEditorChange = (html: string) => {
    setContent(html);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveContent(html), 1500);
  };

  const handleTitleSave = () => { if (title.trim()) { saveContent(content, title.trim()); setEditTitle(false); } };

  const handleCreateFc = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fcFront.trim() || !fcBack.trim()) return; setCreatingFc(true);
    try {
      const res = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ front: fcFront, back: fcBack, notebookId }) });
      const data = await res.json();
      if (data.flashcard) { setNotebook(prev => prev ? { ...prev, flashcards: [data.flashcard, ...(prev.flashcards || [])] } : prev); setFcFront(''); setFcBack(''); setShowFcForm(false); }
    } catch {} setCreatingFc(false);
  };

  const handleDeleteFc = async (fcId: string) => {
    await fetch(`/api/flashcards/${fcId}`, { method: 'DELETE' });
    setNotebook(prev => prev ? { ...prev, flashcards: prev.flashcards?.filter(f => f.id !== fcId) || [] } : prev);
  };

  const handleGenerateFc = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, count: 5 }) });
      const data = await res.json();
      if (data.flashcards) {
        for (const fc of data.flashcards) {
          const r = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ front: fc.front, back: fc.back, notebookId }) });
          const d = await r.json(); if (d.flashcard) setNotebook(prev => prev ? { ...prev, flashcards: [d.flashcard, ...(prev.flashcards || [])] } : prev);
        }
      }
    } catch {} setGenerating(false);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>;
  if (!notebook) return <div className="py-16 text-center"><AlertCircle size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} /><p className="text-sm text-[var(--ws-text-tertiary)]">Caderno nao encontrado</p><button onClick={onBack} className="mt-4 text-sm text-[var(--ws-accent)] hover:underline">Voltar</button></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-text-primary)]"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          {editTitle ? (
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={e => e.key === 'Enter' && handleTitleSave()} autoFocus className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)] bg-transparent border-b border-[var(--ws-accent)]/30 outline-none" />
          ) : (
            <button onClick={() => setEditTitle(true)} className="flex items-center gap-2 group">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: notebook.color }} /><h1 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)] lg:text-2xl group-hover:text-[var(--ws-accent)] transition-colors">{notebook.title}</h1><Edit3 size={14} className="text-[var(--ws-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" /></button>
          )}
        </div>
        {saving && <Loader2 size={14} className="animate-spin text-[var(--ws-text-tertiary)]" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <WabiSabiCard className="min-h-[500px]" hover={false}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]"><Edit3 size={14} className="mr-1.5 inline" /> Suas Anotacoes</h2>
            <span className="text-[10px] text-[var(--ws-text-tertiary)]">Salva automaticamente</span>
          </div>
          <RichTextEditor content={content} onChange={handleEditorChange} placeholder="Comece a escrever suas anotacoes aqui... Use a barra de ferramentas para formatar o texto." />
        </WabiSabiCard>

        <div className="space-y-4">
          <WabiSabiCard hover={false}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--ws-text-secondary)]"><Brain size={14} className="mr-1.5 inline" /> Flashcards ({notebook.flashcards?.length || 0})</h3>
              <div className="flex gap-1">
                <button onClick={handleGenerateFc} disabled={generating} className="flex items-center gap-1 rounded-ws-button border border-[var(--ws-glass-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_8%,transparent)]" title="Gerar flashcards com IA">
                  <Sparkles size={12} className={generating ? 'animate-spin' : ''} /> {generating ? 'Gerando...' : 'Gerar com IA'}
                </button>
                <button onClick={() => setShowFcForm(!showFcForm)} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]">{showFcForm ? <X size={14} /> : <Plus size={14} />}</button>
              </div>
            </div>
            {showFcForm && (
              <form onSubmit={handleCreateFc} className="mt-4 space-y-3 border-t border-[var(--ws-glass-border)] pt-4">
                <input type="text" value={fcFront} onChange={e => setFcFront(e.target.value)} placeholder="Frente (pergunta)" className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" />
                <textarea value={fcBack} onChange={e => setFcBack(e.target.value)} placeholder="Verso (resposta)" rows={3} className="w-full resize-none rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" />
                <ZenButton type="submit" variant="primary" size="sm" className="w-full" disabled={creatingFc || !fcFront.trim() || !fcBack.trim()}>{creatingFc ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar</ZenButton>
              </form>
            )}
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {(!notebook.flashcards || notebook.flashcards.length === 0) && !showFcForm && <p className="py-4 text-center text-xs text-[var(--ws-text-tertiary)]">Crie flashcards manualmente ou gere com IA</p>}
              {notebook.flashcards?.map(fc => (
                <div key={fc.id} className="rounded-ws-button border border-[var(--ws-glass-border)] p-3">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-[var(--ws-text-primary)]">{fc.front}</p><p className="mt-1 line-clamp-2 text-[11px] text-[var(--ws-text-tertiary)]">{fc.back}</p></div><button onClick={() => handleDeleteFc(fc.id)} className="shrink-0 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-accent)]"><Trash2 size={12} /></button></div>
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
function FlashcardsManager() {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [creating, setCreating] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; fetchedRef.current = true;
    setLoading(true);
    fetch('/api/flashcards').then(r => r.json()).then(d => { if (d.flashcards) setFlashcards(d.flashcards); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!front.trim() || !back.trim()) return; setCreating(true);
    try {
      const res = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ front, back }) });
      const data = await res.json(); if (data.flashcard) { setFlashcards(prev => [data.flashcard, ...prev]); setFront(''); setBack(''); }
    } catch {} setCreating(false);
  };

  const handleDelete = async (id: string) => { await fetch(`/api/flashcards/${id}`, { method: 'DELETE' }); setFlashcards(prev => prev.filter(f => f.id !== id)); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8 flex items-start justify-between">
        <div><h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl"><Brain size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Flashcards</h1><p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Crie cartas e revise com spaced repetition</p></div>
      </div>
      <WabiSabiCard className="mb-8" hover={false}>
        <button onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-between text-left"><h2 className="text-sm font-semibold text-[var(--ws-text-secondary)]"><BookPlus size={14} className="mr-1.5 inline" /> {showForm ? 'Fechar' : 'Criar Flashcard'}</h2><motion.div animate={{ rotate: showForm ? 45 : 0 }}><Plus size={16} className="text-[var(--ws-text-tertiary)]" /></motion.div></button>
        <AnimatePresence>{showForm && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleCreate} className="mt-4 space-y-3 overflow-hidden">
            <div><label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Frente (pergunta)</label><input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="O que e fotossintese?" className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" /></div>
            <div><label className="mb-1 block text-xs font-medium text-[var(--ws-text-secondary)]">Verso (resposta)</label><textarea value={back} onChange={e => setBack(e.target.value)} placeholder="Processo pelo qual plantas convertem luz..." rows={3} className="w-full resize-none rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none focus:border-[var(--ws-accent)]/30" /></div>
            <ZenButton type="submit" variant="primary" size="md" className="w-full" disabled={creating || !front.trim() || !back.trim()}>{creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar Flashcard</ZenButton>
          </motion.form>
        )}</AnimatePresence>
      </WabiSabiCard>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div> : flashcards.length === 0 ? (
        <div className="py-16 text-center"><Brain size={48} className="mx-auto mb-4 text-[var(--ws-text-tertiary)]" strokeWidth={1} /><p className="text-sm text-[var(--ws-text-tertiary)]">Nenhum flashcard criado</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flashcards.map((fc, i) => (
            <motion.div key={fc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <WabiSabiCard hover={false}>
                <div className="flex items-start justify-between"><div className="min-w-0 flex-1"><p className="text-xs font-medium text-[var(--ws-text-secondary)]">Frente</p><p className="mt-1 text-sm font-medium text-[var(--ws-text-primary)]">{fc.front}</p><p className="mt-2 text-xs font-medium text-[var(--ws-text-secondary)]">Verso</p><p className="mt-1 line-clamp-2 text-xs text-[var(--ws-text-tertiary)]">{fc.back}</p></div><button onClick={() => handleDelete(fc.id)} className="shrink-0 p-1 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-accent)]"><Trash2 size={14} /></button></div>
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--ws-glass-border)] pt-3"><span className="text-[10px] text-[var(--ws-text-tertiary)]">Revisao: {fc.repetitions}x</span><span className="text-[10px] text-[var(--ws-text-tertiary)]">Intervalo: {fc.interval}d</span></div>
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
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; fetchedRef.current = true;
    fetch('/api/flashcards?due=true').then(r => r.json()).then(d => { if (d.flashcards) setCards(d.flashcards); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleReview = async (quality: number) => {
    const card = cards[currentIndex]; if (!card) return;
    try { await fetch(`/api/flashcards/${card.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review: quality }) }); } catch {}    setReviewed(prev => prev + 1); setFlipped(false);
    if (currentIndex + 1 >= cards.length) setDone(true); else setCurrentIndex(prev => prev + 1);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" /></div>;
  if (cards.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center"><Check size={48} className="mx-auto mb-4 text-[var(--ws-verdigris)]" strokeWidth={1} /><p className="text-sm text-[var(--ws-text-tertiary)]">Nenhuma carta para revisar agora</p><button onClick={onBack} className="mt-4 text-sm text-[var(--ws-accent)] hover:underline">Voltar</button></motion.div>
  );
  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center"><EnsoCircle size={80} strokeWidth={2} color="var(--ws-verdigris)" imperfection={0.1} animate={false} /><h2 className="mt-6 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">Sessao Completa!</h2><p className="mt-2 text-sm text-[var(--ws-text-tertiary)]">Voce revisou {reviewed} cartas</p><ZenButton variant="primary" size="md" className="mt-6" onClick={onBack}>Voltar aos Flashcards</ZenButton></motion.div>
  );

  const card = cards[currentIndex];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-6 flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]"><ArrowLeft size={16} /> Voltar</button><span className="text-xs text-[var(--ws-text-tertiary)]">{currentIndex + 1} de {cards.length}</span></div>
      <div className="mx-auto max-w-xl">
        <div className="mb-8 h-1 w-full rounded-full bg-[var(--ws-glass-border)]"><motion.div className="h-1 rounded-full bg-[var(--ws-accent)]" initial={{ width: 0 }} animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} transition={{ duration: 0.3 }} /></div>
        <div className="perspective-1000 cursor-pointer" onClick={() => !flipped && setFlipped(true)} style={{ perspective: 1000 }}>
          <motion.div className="min-h-[280px]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 100 }} style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-8 backdrop-blur-xl" style={{ backfaceVisibility: 'hidden' }}><p className="mb-4 text-xs font-medium text-[var(--ws-accent)]">PERGUNTA</p><p className="text-center text-lg font-medium leading-relaxed text-[var(--ws-text-primary)]">{card.front}</p><p className="mt-6 text-xs text-[var(--ws-text-tertiary)]">Clique para ver a resposta</p></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-ws-organic border border-[var(--ws-accent)]/20 bg-[var(--ws-bg)] p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><p className="mb-4 text-xs font-medium text-[var(--ws-verdigris)]">RESPOSTA</p><p className="text-center text-base leading-relaxed text-[var(--ws-text-primary)]">{card.back}</p></div>
          </motion.div>
        </div>
        <AnimatePresence>{flipped && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-wrap justify-center gap-3">
            {[['Novamente', '1 min', 1], ['Dificil', '6 min', 2], ['Bom', '10 min', 3], ['Facil', '4 dias', 5]].map(([label, sub, q]) => (
              <button key={label} onClick={() => handleReview(q as number)} className="flex flex-col items-center gap-1 rounded-ws-button border border-[var(--ws-glass-border)] px-5 py-3 transition-all hover:border-[var(--ws-accent)]/30 hover:shadow-md"><span className="text-sm font-medium text-[var(--ws-text-primary)]">{label}</span><span className="text-[10px] text-[var(--ws-text-tertiary)]">{sub}</span></button>
            ))}
          </motion.div>
        )}</AnimatePresence>
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
    if (fetchedRef.current) return; fetchedRef.current = true;
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
          if (prev <= 1) { setIsRunning(false); if (mode === 'focus') { const dur = durations.focus - prev; fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration: dur, type: 'pomodoro' }) }); setTotalToday(t => t + dur); } return 0; }
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-8"><h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl"><Timer size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Pomodoro Timer</h1><p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Estude com foco usando a tecnica Pomodoro</p></div>
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center gap-2">{(['focus', 'short', 'long'] as const).map(m => (<button key={m} onClick={() => switchMode(m)} className={`rounded-ws-button px-4 py-2 text-sm font-medium transition-colors ${mode === m ? 'bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)]' : 'border border-[var(--ws-glass-border)] text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'}`}>{modeLabels[m]}</button>))}</div>
        <WabiSabiCard className="mb-8" hover={false}>
          <div className="flex flex-col items-center py-8">
            <div className="relative flex h-56 w-56 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="var(--ws-glass-border)" strokeWidth="4" /><motion.circle cx="100" cy="100" r="90" fill="none" stroke="var(--ws-accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 90} animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress) }} transition={{ duration: 0.5 }} /></svg>
              <div className="text-center"><p className="font-serif-jp text-5xl font-bold text-[var(--ws-text-primary)]">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p><p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">{modeLabels[mode]}</p></div>
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
          {sessions.length > 0 && <div className="mt-4 max-h-48 space-y-2 overflow-y-auto border-t border-[var(--ws-glass-border)] pt-4">{sessions.map((s, i) => (<div key={i} className="flex items-center justify-between text-xs"><span className="text-[var(--ws-text-tertiary)]">{new Date(s.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><span className="font-medium text-[var(--ws-text-primary)]">{Math.round(s.duration / 60)} min</span></div>))}</div>}
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; fetchedRef.current = true;
    fetch('/api/chat').then(r => r.json()).then(d => { if (d.messages) setMessages(d.messages.length > 0 ? d.messages : [{ id: 'welcome', role: 'assistant', content: 'Konnichiwa! Sou o Sensei AI, seu tutor pessoal. Estou aqui para ajudá-lo em sua jornada de aprendizado. O que gostaria de estudar hoje?', createdAt: new Date().toISOString() }]); }).catch(() => {
      setMessages([{ id: 'welcome', role: 'assistant', content: 'Konnichiwa! Sou o Sensei AI, seu tutor pessoal. Estou aqui para ajudá-lo em sua jornada de aprendizado. O que gostaria de estudar hoje?', createdAt: new Date().toISOString() }]);
    });
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (msgText?: string) => {
    const userMsg = (msgText || input).trim(); if (!userMsg || isLoading) return;
    const userMessage = { id: Date.now().toString(), role: 'user', content: userMsg, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]); setInput(''); setIsLoading(true);
    try { await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'user', message: userMsg }) }); } catch {}    try {
      const res = await fetch('/api/sensei-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) });
      const data = await res.json();
      const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      try { await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'assistant', message: data.reply }) }); } catch {}
    } catch { setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.', createdAt: new Date().toISOString() }]); }
    setIsLoading(false);
  };

  const suggestedPrompts = ['Me ajude a estudar para uma prova', 'Crie um plano de estudos', 'Explique um conceito dificil', 'Dicas para memorizar melhor'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-6"><h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl"><MessageCircle size={24} className="mr-2 inline text-[var(--ws-accent)]" strokeWidth={1.5} />Sensei IA</h1><p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">Seu tutor de IA pessoal para estudos</p></div>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] shadow-[var(--ws-shadow-medium)] backdrop-blur-xl">
        <div className="flex items-center gap-4 border-b border-[var(--ws-glass-border)] px-6 py-4"><EnsoCircle size={36} strokeWidth={2} color="var(--ws-accent)" imperfection={0.1} animate={false} /><div><h3 className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)]">Sensei AI</h3><p className="text-xs text-[var(--ws-text-tertiary)]">Seu tutor pessoal</p></div><div className="ml-auto flex items-center gap-2"><div className="h-2 w-2 animate-pulse rounded-full bg-[var(--ws-verdigris)]" /><span className="text-xs text-[var(--ws-text-tertiary)]">Online</span></div></div>
        <div ref={scrollRef} className="h-[500px] overflow-y-auto p-6">
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && <EnsoCircle size={28} strokeWidth={1.5} color="var(--ws-accent)" imperfection={0.08} animate={false} />}
                  <div className={`max-w-[80%] rounded-ws-organic px-5 py-3 ${msg.role === 'user' ? 'bg-[var(--ws-ink)] text-[var(--ws-text-on-dark)]' : 'border border-[var(--ws-glass-border)] bg-white/60 text-[var(--ws-text-primary)]'}`}><p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p></div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3"><EnsoCircle size={28} strokeWidth={1.5} color="var(--ws-accent)" imperfection={0.08} animate={false} /><div className="flex items-center gap-1.5 rounded-ws-organic border border-[var(--ws-glass-border)] bg-white/60 px-5 py-3">{[0, 1, 2].map(j => (<motion.div key={j} className="h-2 w-2 rounded-full bg-[var(--ws-text-tertiary)]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }} />))}</div></motion.div>}
          </div>
          {/* Suggested prompts */}
          {messages.length <= 1 && !isLoading && (
            <div className="mt-6 flex flex-wrap gap-2">
              {suggestedPrompts.map(p => (<button key={p} onClick={() => handleSend(p)} className="rounded-full border border-[var(--ws-glass-border)] px-3 py-1.5 text-xs text-[var(--ws-text-secondary)] transition-colors hover:border-[var(--ws-accent)]/30 hover:bg-[color-mix(in_srgb,var(--ws-accent)_5%,transparent)]">{p}</button>))}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--ws-glass-border)] p-4">
          <div className="flex items-center gap-3 rounded-ws-organic border border-[var(--ws-glass-border)] bg-white/60 px-4 py-3">
            <input type="text" placeholder="Faça uma pergunta sobre seus estudos..." className="flex-1 bg-transparent text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)] transition-colors hover:bg-[var(--ws-accent-hover)] disabled:opacity-50" aria-label="Enviar"><Send size={14} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
