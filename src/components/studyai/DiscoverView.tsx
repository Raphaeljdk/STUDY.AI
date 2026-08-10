'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Search, Bookmark, BookmarkCheck, Sparkles,
  Loader2, Clock, ChevronDown, ChevronUp,
  BookPlus, Brain, FileQuestion, X, Plus, Check, RotateCcw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiFetch, ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ===== TYPES =====
interface DiscoverViewProps {
  onNavigate: (tab: string) => void;
}

interface DiscoverItem {
  id: string;
  type: string;
  title: string;
  content: string;
  summary: string | null;
  subject: string | null;
  difficulty: string;
  duration: number | null;
  emoji: string;
  tags: string | null;
  isPublic: boolean;
  likes: number;
  saves: number;
  userId: string | null;
  user: { id: string; name: string } | null;
  createdAt: string;
  _count?: { discoverSaves: number };
  isSaved?: boolean;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ===== CARD TYPE CONFIG =====
const CARD_TYPES: Record<string, { label: string; emoji: string; accent: string; accentBg: string; accentBorder: string }> = {
  mini_aula: { label: 'Mini-aula', emoji: '🏭', accent: '#DC2626', accentBg: 'rgba(220,38,38,0.08)', accentBorder: 'rgba(220,38,38,0.2)' },
  dica: { label: 'Dica', emoji: '💡', accent: '#D97706', accentBg: 'rgba(217,119,6,0.08)', accentBorder: 'rgba(217,119,6,0.2)' },
  conceito: { label: 'Conceito', emoji: '🧠', accent: '#7C3AED', accentBg: 'rgba(124,58,237,0.08)', accentBorder: 'rgba(124,58,237,0.2)' },
  questao: { label: 'Questao', emoji: '❓', accent: '#2563EB', accentBg: 'rgba(37,99,235,0.08)', accentBorder: 'rgba(37,99,235,0.2)' },
  resumo: { label: 'Resumo', emoji: '📌', accent: '#16A34A', accentBg: 'rgba(22,163,74,0.08)', accentBorder: 'rgba(22,163,74,0.2)' },
  curiosidade: { label: 'Curiosidade', emoji: '⚡', accent: '#EA580C', accentBg: 'rgba(234,88,12,0.08)', accentBorder: 'rgba(234,88,12,0.2)' },
  tecnica: { label: 'Tecnica', emoji: '📝', accent: '#0D9488', accentBg: 'rgba(13,148,136,0.08)', accentBorder: 'rgba(13,148,136,0.2)' },
  codigo: { label: 'Codigo', emoji: '💻', accent: '#6B7280', accentBg: 'rgba(107,114,128,0.08)', accentBorder: 'rgba(107,114,128,0.2)' },
  formula: { label: 'Formula', emoji: '📐', accent: '#DB2777', accentBg: 'rgba(219,39,119,0.08)', accentBorder: 'rgba(219,39,119,0.2)' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  facil: { label: 'Facil', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  medio: { label: 'Medio', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  dificil: { label: 'Dificil', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

const FILTER_OPTIONS = [
  { key: 'todos', label: 'Todos', emoji: '✨' },
  ...Object.entries(CARD_TYPES).map(([key, val]) => ({ key, label: val.label, emoji: val.emoji })),
];

const AI_SUBJECTS = [
  'Matematica', 'Fisica', 'Quimica', 'Biologia', 'Historia',
  'Geografia', 'Portugues', 'Ingles', 'Literatura', 'Filosofia',
  'Sociologia', 'Programacao', 'Estatistica', 'Algebra', 'Geometria',
  'Trigonometria', 'Calculo', 'Redacao', 'Gramatica', 'Estudos Gerais',
];

const AI_DIFFICULTIES = [
  { key: 'facil', label: 'Facil' },
  { key: 'medio', label: 'Medio' },
  { key: 'dificil', label: 'Dificil' },
];

// ===== SKELETON =====
function SkeletonCard() {
  return (
    <div
      className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-5"
      style={{ borderRadius: 'var(--ws-radius-card)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="skeleton h-8 w-8 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 mb-3" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
        <div className="skeleton h-3 w-2/3" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ===== EMPTY STATE =====
function EmptyState({ hasFilter, onGenerateClick }: { hasFilter: boolean; onGenerateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center text-4xl"
        style={{
          background: 'var(--ws-glass)',
          borderRadius: '50%',
          border: '1px solid var(--ws-glass-border)',
        }}
      >
        {hasFilter ? '🔍' : '🌿'}
      </div>
      <h3
        className="font-serif-jp text-xl font-semibold mb-2"
        style={{ color: 'var(--ws-text-primary)' }}
      >
        {hasFilter ? 'Nenhum resultado encontrado' : 'Explore o Discover'}
      </h3>
      <p
        className="text-sm max-w-xs"
        style={{ color: 'var(--ws-text-tertiary)' }}
      >
        {hasFilter
          ? 'Tente ajustar os filtros ou buscar por outro termo.'
          : 'Conteudo educacional incrivel esta esperando por voce. Gere seu primeiro conteudo com IA!'}
      </p>
      {!hasFilter && (
        <button
          onClick={onGenerateClick}
          className="mt-6 flex items-center gap-2 rounded-ws-button px-5 py-2.5 text-sm font-medium text-white transition-ws"
          style={{
            background: 'var(--ws-accent)',
            boxShadow: 'var(--ws-shadow-soft)',
          }}
        >
          <Sparkles className="h-4 w-4" />
          Gerar com IA
        </button>
      )}
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export function DiscoverView({ onNavigate }: DiscoverViewProps) {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fetchError, setFetchError] = useState(false);

  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiType, setAiType] = useState('dica');
  const [aiSubject, setAiSubject] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medio');
  const [aiGenerating, setAiGenerating] = useState(false);

  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [subjectSelectItemId, setSubjectSelectItemId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // ===== FETCH =====
  const fetchItems = useCallback(async (pageNum: number, type?: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (type && type !== 'todos') params.set('type', type);
      const data = await apiFetch(`/api/discover?${params.toString()}`);
      if (pageNum === 1) {
        setItems(data.items || []);
      } else {
        setItems(prev => [...prev, ...(data.items || [])]);
      }
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      setFetchError(true);
      toast({ title: 'Erro ao carregar conteudo', description: 'Tente novamente mais tarde.' });
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await apiFetch('/api/subjects').catch(() => null);
      if (data) {
        setSubjects(Array.isArray(data) ? data : data.subjects || []);
      }
    } catch {
      // silent
    }
  }, []);

  const retryFetch = useCallback(async () => {
    setFetchError(false);
    setLoading(true);
    setPage(1);
    await fetchItems(1, activeFilter);
    setLoading(false);
  }, [activeFilter, fetchItems]);

  useEffect(() => {
    const load = async () => {
      setFetchError(false);
      setLoading(true);
      setPage(1);
      await fetchItems(1, activeFilter);
      setLoading(false);
    };
    load();
  }, [activeFilter, fetchItems]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    await fetchItems(next, activeFilter);
  }, [loading, page, totalPages, activeFilter, fetchItems]);

  // ===== FILTERED ITEMS =====
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.tags?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // ===== SAVE =====
  const handleSave = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSavingId(itemId);
    try {
      const data = await apiFetch(`/api/discover/${itemId}/save`, { method: 'POST' });
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, isSaved: data.isSaved, saves: data.isSaved ? item.saves + 1 : Math.max(0, item.saves - 1) }
            : item
        )
      );
      toast({
        title: data.isSaved ? 'Salvo!' : 'Removido dos salvos',
        description: data.isSaved ? 'Conteudo adicionado aos seus salvos.' : 'Conteudo removido dos salvos.',
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possível salvar o conteudo.' });
    } finally {
      setSavingId(null);
    }
  };

  // ===== AI GENERATE =====
  const handleAIGenerate = async () => {
    if (!aiSubject.trim()) {
      toast({ title: 'Informe o assunto', description: 'Digite um assunto para gerar conteudo.' });
      return;
    }
    setAiGenerating(true);
    try {
      const data = await apiFetch('/api/discover', {
        method: 'POST',
        body: JSON.stringify({ type: aiType, subject: aiSubject.trim(), difficulty: aiDifficulty, generateWithAI: true }),
      });
      if (data.item) {
        setItems(prev => [data.item, ...prev]);
        toast({ title: 'Conteudo gerado!', description: data.item.title });
      }
      setShowAIDialog(false);
      setAiSubject('');
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro ao gerar', description: err.message || 'Tente novamente.' });
    } finally {
      setAiGenerating(false);
    }
  };

  // ===== ADD TO SUBJECT =====
  const openSubjectSelector = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSubjectSelectItemId(itemId);
    setSelectedSubjectId('');
    setShowSubjectDialog(true);
  };

  const handleAddToSubject = async () => {
    if (!selectedSubjectId || !subjectSelectItemId) return;
    try {
      const item = items.find(i => i.id === subjectSelectItemId);
      if (!item) return;
      await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: `[Discover] ${item.title}`, content: item.content, subjectId: selectedSubjectId }),
      });
      toast({ title: 'Adicionado a materia!', description: 'Conteudo salvo na materia selecionada.' });
      setShowSubjectDialog(false);
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel adicionar a materia.' });
    }
  };

  const handleGenerateFlashcards = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: 'Flashcards em breve!', description: 'Funcionalidade sera liberada em breve.' });
  };

  const handleGenerateQuestions = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: 'Questoes em breve!', description: 'Funcionalidade sera liberada em breve.' });
  };

  // ===== HELPERS =====
  const getTypeConfig = (type: string) => CARD_TYPES[type] || CARD_TYPES.dica;
  const getDifficultyConfig = (d: string) => DIFFICULTY_CONFIG[d] || DIFFICULTY_CONFIG.medio;
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}min`;
  };

  const hasActiveFilter = activeFilter !== 'todos' || !!searchQuery.trim();

  return (
    <div className="relative min-h-full pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif-jp text-2xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
          Discover
        </h1>
        <p className="text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
          Explore conteudo educacional gerado pela comunidade e IA
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: 'var(--ws-text-tertiary)' }}
        />
        <Input
          placeholder="Buscar conteudo..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11 w-full rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus-visible:ring-[var(--ws-accent)]/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-ws"
            style={{ color: 'var(--ws-text-tertiary)' }}
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {FILTER_OPTIONS.map(opt => {
            const isActive = activeFilter === opt.key;
            const typeConf = opt.key !== 'todos' ? CARD_TYPES[opt.key] : null;
            return (
              <button
                key={opt.key}
                onClick={() => { setActiveFilter(opt.key); setPage(1); }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-ws-button px-3.5 py-2 text-xs font-medium transition-ws"
                style={{
                  background: isActive
                    ? typeConf ? typeConf.accentBg : 'color-mix(in srgb, var(--ws-accent) 10%, transparent)'
                    : 'var(--ws-glass)',
                  color: isActive
                    ? typeConf ? typeConf.accent : 'var(--ws-accent)'
                    : 'var(--ws-text-secondary)',
                  border: `1px solid ${isActive
                    ? typeConf ? typeConf.accentBorder : 'color-mix(in srgb, var(--ws-accent) 25%, transparent)'
                    : 'var(--ws-glass-border)'}`,
                  boxShadow: isActive ? 'var(--ws-shadow-soft)' : 'none',
                }}
                aria-pressed={isActive}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      {loading && items.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : fetchError && items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center text-4xl"
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              borderRadius: '50%',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            {'\uD83D\uDE13'}
          </div>
          <h3
            className="font-serif-jp text-xl font-semibold mb-2"
            style={{ color: 'var(--ws-text-primary)' }}
          >
            Erro ao carregar
          </h3>
          <p
            className="text-sm max-w-xs mb-6"
            style={{ color: 'var(--ws-text-tertiary)' }}
          >
            Nao foi possivel carregar o conteudo. Verifique sua conexao e tente novamente.
          </p>
          <button
            onClick={retryFetch}
            disabled={loading}
            className="flex items-center gap-2 rounded-ws-button px-5 py-2.5 text-sm font-medium text-white transition-ws"
            style={{
              background: 'var(--ws-accent)',
              boxShadow: 'var(--ws-shadow-soft)',
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Tentar novamente
          </button>
        </motion.div>
      ) : filteredItems.length === 0 ? (
        <EmptyState hasFilter={hasActiveFilter} onGenerateClick={() => setShowAIDialog(true)} />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const typeConf = getTypeConfig(item.type);
              const diffConf = getDifficultyConfig(item.difficulty);
              const isExpanded = expandedId === item.id;
              const duration = formatDuration(item.duration);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2), ease: [0.4, 0, 0.2, 1] }}
                  className="hover-lift cursor-pointer"
                  style={{ borderRadius: 'var(--ws-radius-card)' }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div
                    className="border backdrop-blur-xl p-5 transition-ws"
                    style={{
                      borderRadius: 'var(--ws-radius-card)',
                      borderColor: isExpanded ? typeConf.accentBorder : 'var(--ws-glass-border)',
                      background: isExpanded
                        ? `color-mix(in srgb, ${typeConf.accent} 3%, var(--ws-glass))`
                        : 'var(--ws-glass)',
                      boxShadow: isExpanded
                        ? `0 8px 40px color-mix(in srgb, ${typeConf.accent} 8%, transparent)`
                        : 'var(--ws-shadow-soft)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-lg"
                        style={{ background: typeConf.accentBg, borderRadius: '12px 11px 13px 10px' }}
                      >
                        {item.emoji || typeConf.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ background: typeConf.accentBg, color: typeConf.accent }}
                          >
                            {typeConf.label}
                          </span>
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: diffConf.bg, color: diffConf.color }}
                          >
                            {diffConf.label}
                          </span>
                          {duration && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px]"
                              style={{ color: 'var(--ws-text-tertiary)' }}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleSave(e, item.id)}
                        className="flex-shrink-0 rounded-full p-1.5 transition-ws hover:scale-110"
                        style={{ color: item.isSaved ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)' }}
                        disabled={savingId === item.id}
                        aria-label={item.isSaved ? 'Remover dos salvos' : 'Salvar conteudo'}
                      >
                        {savingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : item.isSaved ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-[15px] leading-snug mb-2" style={{ color: 'var(--ws-text-primary)' }}>
                      {item.title}
                    </h3>

                    {/* Summary */}
                    {!isExpanded && (
                      <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--ws-text-secondary)' }}>
                        {item.summary || item.content.replace(/[#*_`]/g, '').substring(0, 150)}
                      </p>
                    )}

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="markdown-content text-sm leading-relaxed mb-4 pt-1" style={{ color: 'var(--ws-text-secondary)' }}>
                            <ReactMarkdown>{item.content}</ReactMarkdown>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--ws-glass-border)' }}>
                            <button
                              onClick={(e) => openSubjectSelector(e, item.id)}
                              className="inline-flex items-center gap-1.5 rounded-ws-button px-3 py-1.5 text-xs font-medium transition-ws"
                              style={{ background: typeConf.accentBg, color: typeConf.accent, border: `1px solid ${typeConf.accentBorder}` }}
                            >
                              <BookPlus className="h-3 w-3" />
                              Adicionar a materia
                            </button>
                            <button
                              onClick={handleGenerateFlashcards}
                              className="inline-flex items-center gap-1.5 rounded-ws-button px-3 py-1.5 text-xs font-medium transition-ws"
                              style={{ background: 'var(--ws-glass)', color: 'var(--ws-text-secondary)', border: '1px solid var(--ws-glass-border)' }}
                            >
                              <Brain className="h-3 w-3" />
                              Gerar flashcards
                            </button>
                            <button
                              onClick={handleGenerateQuestions}
                              className="inline-flex items-center gap-1.5 rounded-ws-button px-3 py-1.5 text-xs font-medium transition-ws"
                              style={{ background: 'var(--ws-glass)', color: 'var(--ws-text-secondary)', border: '1px solid var(--ws-glass-border)' }}
                            >
                              <FileQuestion className="h-3 w-3" />
                              Gerar questoes
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {item.subject && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal rounded-full px-2 py-0"
                          style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }}
                        >
                          {item.subject}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                        <Bookmark className="h-2.5 w-2.5" />
                        {item.saves}
                      </span>
                      <div className="ml-auto">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" style={{ color: typeConf.accent }} />
                        ) : (
                          <ChevronDown className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {page < totalPages && (
            <div className="flex justify-center pt-4 pb-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)] hover:bg-[var(--ws-glass)] hover:text-[var(--ws-text-primary)]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        onClick={() => setShowAIDialog(true)}
        className="fixed bottom-24 right-4 sm:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'var(--ws-accent)',
          color: 'var(--ws-text-on-dark)',
          boxShadow: 'var(--ws-shadow-enso), var(--ws-shadow-medium)',
        }}
        aria-label="Gerar conteudo com IA"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      {/* ===== AI DIALOG ===== */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent
          className="sm:max-w-md rounded-ws-organic border-[var(--ws-glass-border)] bg-[var(--ws-bg)] p-6"
          style={{ boxShadow: 'var(--ws-shadow-medium)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-lg" style={{ color: 'var(--ws-text-primary)' }}>
              <span className="mr-2">{'\u2728'}</span>Gerar conteudo com IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Type */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ws-text-secondary)' }}>
                Tipo de conteudo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CARD_TYPES).map(([key, val]) => {
                  const isAct = aiType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAiType(key)}
                      className="flex flex-col items-center gap-1 rounded-ws-button p-2.5 text-center transition-ws"
                      style={{
                        background: isAct ? val.accentBg : 'var(--ws-glass)',
                        border: `1px solid ${isAct ? val.accentBorder : 'var(--ws-glass-border)'}`,
                        color: isAct ? val.accent : 'var(--ws-text-secondary)',
                      }}
                    >
                      <span className="text-base">{val.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight">{val.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ws-text-secondary)' }}>
                Assunto
              </label>
              <Input
                placeholder="Ex: Termodinamica, literatura brasileira..."
                value={aiSubject}
                onChange={e => setAiSubject(e.target.value)}
                className="h-10 rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)] text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AI_SUBJECTS.slice(0, 8).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setAiSubject(sub)}
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-ws"
                    style={{
                      background: aiSubject === sub ? 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' : 'var(--ws-glass)',
                      color: aiSubject === sub ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)',
                      border: `1px solid ${aiSubject === sub ? 'color-mix(in srgb, var(--ws-accent) 25%, transparent)' : 'var(--ws-glass-border)'}`,
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ws-text-secondary)' }}>
                Dificuldade
              </label>
              <div className="flex gap-2">
                {AI_DIFFICULTIES.map(d => {
                  const dc = DIFFICULTY_CONFIG[d.key];
                  const isAct = aiDifficulty === d.key;
                  return (
                    <button
                      key={d.key}
                      onClick={() => setAiDifficulty(d.key)}
                      className="flex-1 rounded-ws-button py-2 text-xs font-medium transition-ws"
                      style={{
                        background: isAct ? dc.bg : 'var(--ws-glass)',
                        color: isAct ? dc.color : 'var(--ws-text-secondary)',
                        border: `1px solid ${isAct ? dc.color + '33' : 'var(--ws-glass-border)'}`,
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAIDialog(false)}
              className="rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)]"
              disabled={aiGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={aiGenerating || !aiSubject.trim()}
              className="rounded-ws-button"
              style={{ background: 'var(--ws-accent)' }}
            >
              {aiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== SUBJECT DIALOG ===== */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent
          className="sm:max-w-sm rounded-ws-organic border-[var(--ws-glass-border)] bg-[var(--ws-bg)] p-6"
          style={{ boxShadow: 'var(--ws-shadow-medium)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-lg" style={{ color: 'var(--ws-text-primary)' }}>
              <span className="mr-2">{'\uD83D\uDCDA'}</span>Adicionar a materia
            </DialogTitle>
          </DialogHeader>

          {subjects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm mb-3" style={{ color: 'var(--ws-text-tertiary)' }}>
                Nenhuma materia encontrada. Crie uma materia primeiro.
              </p>
              <Button
                variant="outline"
                onClick={() => { setShowSubjectDialog(false); onNavigate('subjects'); }}
                className="rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar materia
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
                {subjects.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className="flex w-full items-center gap-3 rounded-ws-button p-3 text-left transition-ws"
                    style={{
                      background: selectedSubjectId === sub.id
                        ? 'color-mix(in srgb, var(--ws-accent) 8%, transparent)'
                        : 'var(--ws-glass)',
                      border: `1px solid ${selectedSubjectId === sub.id
                        ? 'color-mix(in srgb, var(--ws-accent) 30%, transparent)'
                        : 'var(--ws-glass-border)'}`,
                    }}
                  >
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: sub.color }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                      {sub.name}
                    </span>
                    {selectedSubjectId === sub.id && (
                      <Check className="h-4 w-4 ml-auto" style={{ color: 'var(--ws-accent)' }} />
                    )}
                  </button>
                ))}
              </div>
              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubjectDialog(false)}
                  className="rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddToSubject}
                  disabled={!selectedSubjectId}
                  className="rounded-ws-button"
                  style={{ background: 'var(--ws-accent)' }}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DiscoverView;
