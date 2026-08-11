'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Plus, Loader2, Trash2, Sparkles, Check,
  ChevronRight, ChevronUp, ChevronDown, Clock, BookOpen, Zap,
  Target, ArrowRight, ListChecks, Play, Pause,
  Milestone, Route, Lightbulb, X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WabiSabiCard } from './WabiSabiCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ===== TYPES =====
interface RoadmapStep {
  name: string;
  description: string;
  estimatedHours: number;
  difficulty: string;
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  steps: string; // JSON string
  totalSteps: number;
  currentStep: number;
  status: string;
  isAI: boolean;
  createdAt: string;
}

const SUGGESTED_ROADMAPS = [
  {
    title: 'Desenvolvimento Backend',
    topic: 'desenvolvimento backend',
    emoji: '⚙️',
    description: 'APIs, banco de dados, autenticacao e deploy',
  },
  {
    title: 'Machine Learning',
    topic: 'machine learning',
    emoji: '🤖',
    description: 'Fundamentos de IA, modelos preditivos e deep learning',
  },
  {
    title: 'Ciencia de Dados',
    topic: 'ciencia de dados',
    emoji: '📊',
    description: 'Analise, visualizacao e storytelling com dados',
  },
  {
    title: 'Frontend Avancado',
    topic: 'frontend avancado react typescript',
    emoji: '🎨',
    description: 'React, TypeScript, performance e arquitetura',
  },
];

function getDifficultyColor(difficulty: string): string {
  const d = difficulty?.toLowerCase() || '';
  if (d.includes('facil') || d.includes('iniciante')) return 'var(--ws-verdigris)';
  if (d.includes('medio') || d.includes('intermediario')) return 'var(--ws-gold)';
  return 'var(--ws-accent)';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return { bg: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)', color: 'var(--ws-verdigris)', label: 'Concluida' };
    case 'paused':
      return { bg: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)', color: 'var(--ws-gold)', label: 'Pausada' };
    default:
      return { bg: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)', color: 'var(--ws-accent)', label: 'Em andamento' };
  }
}

// ===== COMPONENT =====
export function RoadmapView() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Generate dialog
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateInput, setGenerateInput] = useState('');
  const [generating, setGenerating] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Roadmap | null>(null);

  // Animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  // Fetch roadmaps
  const fetchRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/roadmaps');
      setRoadmaps(data.roadmaps || []);
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel carregar as trilhas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoadmaps(); }, [fetchRoadmaps]);

  // Generate roadmap with AI
  const generateRoadmap = async (topic: string) => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const defaultSteps: RoadmapStep[] = generateDefaultSteps(topic);
      await apiFetch('/api/roadmaps', {
        method: 'POST',
        body: JSON.stringify({
          title: `Trilha: ${topic.trim()}`,
          topic: topic.trim(),
          description: `Plano de estudo gerado por IA para ${topic.trim()}`,
          steps: defaultSteps,
          isAI: true,
        }),
      });
      toast({ title: 'Trilha criada!', description: 'Sua trilha de aprendizagem foi gerada.' });
      setGenerateOpen(false);
      setGenerateInput('');
      fetchRoadmaps();
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel gerar a trilha.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // Generate roadmap via AI suggestion
  const handleSuggestedRoadmap = async (suggestion: typeof SUGGESTED_ROADMAPS[0]) => {
    setGenerating(true);
    try {
      // Generate steps locally based on topic
      const defaultSteps: RoadmapStep[] = generateDefaultSteps(suggestion.topic);
      await apiFetch('/api/roadmaps', {
        method: 'POST',
        body: JSON.stringify({
          title: suggestion.title,
          topic: suggestion.topic,
          description: suggestion.description,
          steps: defaultSteps,
          isAI: true,
        }),
      });
      toast({ title: 'Trilha criada!', description: `${suggestion.title} adicionada as suas trilhas.` });
      fetchRoadmaps();
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel criar a trilha.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // Complete step
  const completeStep = async (roadmap: Roadmap, stepIndex: number) => {
    try {
      let steps: RoadmapStep[] = [];
      try {
        steps = JSON.parse(roadmap.steps);
      } catch { /* empty */ }

      const newStep = stepIndex + 1;
      const newStatus = newStep >= roadmap.totalSteps ? 'completed' : 'active';

      const data = await apiFetch(`/api/roadmaps/${roadmap.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentStep: newStep, status: newStatus }),
      });

      if (newStatus === 'completed') {
        toast({ title: 'Trilha concluida!', description: `Parabens! Voce completou "${roadmap.title}".` });
      }
      fetchRoadmaps();
      // Update selected if viewing detail
      if (selectedRoadmap?.id === roadmap.id) {
        setSelectedRoadmap(data.roadmap);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel atualizar a trilha.', variant: 'destructive' });
    }
  };

  // Delete roadmap
  const deleteRoadmap = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/roadmaps/${deleteTarget.id}`, { method: 'DELETE' });
      toast({ title: 'Trilha removida', description: '"${deleteTarget.title}" foi excluida.' });
      if (selectedRoadmap?.id === deleteTarget.id) setSelectedRoadmap(null);
      setDeleteTarget(null);
      fetchRoadmaps();
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel excluir a trilha.', variant: 'destructive' });
    }
  };

  // Toggle step expansion
  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Parse steps helper
  const parseSteps = (roadmap: Roadmap): RoadmapStep[] => {
    try {
      const parsed = JSON.parse(roadmap.steps);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // ===== RENDER =====

  // Detail view
  if (selectedRoadmap) {
    const steps = parseSteps(selectedRoadmap);
    const statusBadge = getStatusBadge(selectedRoadmap.status);
    const progress = selectedRoadmap.totalSteps > 0
      ? Math.round((selectedRoadmap.currentStep / selectedRoadmap.totalSteps) * 100)
      : 0;

    return (
      <motion.div
        className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* Back button */}
        <button
          onClick={() => { setSelectedRoadmap(null); setExpandedSteps(new Set()); }}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--ws-accent)' }}
        >
          <ChevronRight className="h-4 w-4 rotate-180" /> Voltar as trilhas
        </button>

        {/* Header */}
        <WabiSabiCard hover={false} glass>
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="font-serif-jp text-2xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>{selectedRoadmap.title}</h1>
              {selectedRoadmap.description && (
                <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-secondary)' }}>{selectedRoadmap.description}</p>
              )}
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: statusBadge.bg, color: statusBadge.color }}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--ws-text-secondary)' }}>Progresso</span>
            <span className="font-semibold" style={{ color: 'var(--ws-accent)' }}>{selectedRoadmap.currentStep}/{selectedRoadmap.totalSteps} etapas</span>
          </div>
          <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-ink) 6%, transparent)' }}>
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: 'var(--ws-accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          {selectedRoadmap.isAI && (
            <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
              <Sparkles className="h-3 w-3" /> Gerada por IA
            </div>
          )}
        </WabiSabiCard>

        {/* Timeline steps */}
        <div className="relative pl-8">
          {/* Vertical line */}
          <div
            className="absolute bottom-0 left-3 top-0 w-0.5"
            style={{ background: 'var(--ws-glass-border)' }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < selectedRoadmap.currentStep;
            const isCurrent = idx === selectedRoadmap.currentStep;
            const isExpanded = expandedSteps.has(idx);

            return (
              <motion.div
                key={idx}
                className="relative mb-4 last:mb-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {/* Dot */}
                <div
                  className="absolute -left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: isCompleted ? 'var(--ws-verdigris)' : isCurrent ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                    background: isCompleted ? 'var(--ws-verdigris)' : isCurrent ? 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' : 'var(--ws-bg)',
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" style={{ color: 'var(--ws-text-on-dark)' }} />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: isCurrent ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)' }}>{idx + 1}</span>
                  )}
                </div>

                {/* Card */}
                <div
                  className="cursor-pointer rounded-ws-card border p-4 transition-all hover-lift"
                  style={{
                    borderColor: isCurrent ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                    background: isCurrent ? 'color-mix(in srgb, var(--ws-accent) 4%, var(--ws-glass))' : 'var(--ws-glass)',
                  }}
                  onClick={() => toggleStep(idx)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: `${getDifficultyColor(step.difficulty)}15`, color: getDifficultyColor(step.difficulty) }}
                        >
                          {step.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                          <Clock className="h-3 w-3" /> {step.estimatedHours}h
                        </span>
                      </div>
                      <h3
                        className="mt-1.5 text-sm font-semibold"
                        style={{ color: isCompleted ? 'var(--ws-text-tertiary)' : 'var(--ws-text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}
                      >
                        {step.name}
                      </h3>
                    </div>
                    <div className="ml-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} /> : <ChevronDown className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                          {step.description}
                        </p>
                        {!isCompleted && (
                          <Button
                            size="sm"
                            className="mt-3 rounded-ws-button"
                            style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }}
                            onClick={(e) => { e.stopPropagation(); completeStep(selectedRoadmap, idx); }}
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Marcar como concluido
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-1.5 backdrop-blur-xl">
          <Route className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Trilhas de Aprendizagem</span>
        </div>
        <h1 className="font-serif-jp text-3xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
          Roadmaps
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
          Planeje seu caminho de aprendizagem
        </p>
      </motion.div>

      {/* Generate button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={() => setGenerateOpen(true)}
          className="w-full rounded-ws-button py-6 text-base font-semibold"
          style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="mr-2 h-5 w-5" /> Gerar nova trilha
        </Button>
      </motion.div>

      {/* Suggested roadmaps (when empty) */}
      {roadmaps.length === 0 && !loading && (
        <motion.div variants={itemVariants}>
          <WabiSabiCard hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" style={{ color: 'var(--ws-gold)' }} />
              <div>
                <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Sugestoes populares</h2>
                <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Comece com uma trilha pre-estruturada</p>
              </div>
            </div>

            <div className="space-y-2">
              {SUGGESTED_ROADMAPS.map((s) => (
                <button
                  key={s.topic}
                  className="flex w-full items-center gap-3 rounded-ws-button border border-[var(--ws-glass-border)] p-3 text-left transition-all hover:border-[var(--ws-accent)] hover-lift"
                  style={{ background: 'var(--ws-glass)' }}
                  onClick={() => handleSuggestedRoadmap(s)}
                  disabled={generating}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>{s.title}</span>
                    <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>{s.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                </button>
              ))}
            </div>
          </WabiSabiCard>
        </motion.div>
      )}

      {/* Roadmap list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card h-24" />
          ))}
        </div>
      ) : roadmaps.length > 0 ? (
        <motion.div variants={itemVariants} className="space-y-3">
          {roadmaps.map((rm, idx) => {
            const steps = parseSteps(rm);
            const statusBadge = getStatusBadge(rm.status);
            const progress = rm.totalSteps > 0 ? Math.round((rm.currentStep / rm.totalSteps) * 100) : 0;
            const totalHours = steps.reduce((sum, s) => sum + (s.estimatedHours || 0), 0);

            return (
              <motion.div
                key={rm.id}
                className="group cursor-pointer rounded-ws-card border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4 backdrop-blur-xl transition-all hover-lift"
                onClick={() => setSelectedRoadmap(rm)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {rm.isAI && <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--ws-gold)' }} />}
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>{rm.title}</h3>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }}>
                        {rm.topic}
                      </Badge>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {totalHours}h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: statusBadge.bg, color: statusBadge.color }}
                    >
                      {statusBadge.label}
                    </span>
                    <button
                      className="rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ background: 'color-mix(in srgb, var(--ws-accent) 8%, transparent)' }}
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(rm); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--ws-accent)' }} />
                    </button>
                    <ChevronRight className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-ink) 6%, transparent)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: rm.status === 'completed' ? 'var(--ws-verdigris)' : 'var(--ws-accent)' }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--ws-text-secondary)' }}>
                    {rm.currentStep}/{rm.totalSteps}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : null}

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--ws-bg)', borderRadius: 'var(--ws-radius-card)' }}>
          <DialogHeader>
            <DialogTitle className="font-serif-jp" style={{ color: 'var(--ws-text-primary)' }}>
              <Sparkles className="mr-2 inline h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
              Gerar nova trilha
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
                Quero aprender...
              </label>
              <Input
                placeholder="Ex: desenvolvimento backend, machine learning, calculo..."
                value={generateInput}
                onChange={(e) => setGenerateInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && generateInput.trim()) generateRoadmap(generateInput); }}
                className="rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)]"
                style={{ color: 'var(--ws-text-primary)' }}
              />
            </div>

            <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
              A IA vai criar uma trilha completa com 8-15 etapas ordenadas, cada uma com descricao, duracao estimada e dificuldade.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-ws-button"
              style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-secondary)' }}
              onClick={() => setGenerateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-ws-button"
              style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }}
              onClick={() => generateRoadmap(generateInput)}
              disabled={generating || !generateInput.trim()}
            >
              {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar trilha</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" style={{ background: 'var(--ws-bg)', borderRadius: 'var(--ws-radius-card)' }}>
          <DialogHeader>
            <DialogTitle className="font-serif-jp" style={{ color: 'var(--ws-text-primary)' }}>Excluir trilha?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
            Tem certeza que deseja excluir &ldquo;{deleteTarget?.title}&rdquo;? Esta acao nao pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-ws-button"
              style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-secondary)' }}
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-ws-button"
              style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }}
              onClick={deleteRoadmap}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ===== HELPER: Generate default steps for suggested roadmaps =====
function generateDefaultSteps(topic: string): RoadmapStep[] {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes('backend') || topicLower.includes('desenvolvimento')) {
    return [
      { name: 'Fundamentos de HTTP e APIs REST', description: 'Entenda como a web funciona por tras: protocolo HTTP, metodos, status codes e arquitetura REST.', estimatedHours: 4, difficulty: 'Iniciante' },
      { name: 'Linguagem de programacao (Node.js/Python)', description: 'Domine os fundamentos da linguagem escolhida: sintaxe, estruturas de dados, funcoes e modulos.', estimatedHours: 8, difficulty: 'Iniciante' },
      { name: 'Banco de dados relacional (SQL)', description: 'Aprenda a modelar, criar e consultar bancos relacionais com SQL. Entenda normalizacao e indices.', estimatedHours: 6, difficulty: 'Iniciante' },
      { name: 'ORM e manipulacao de dados', description: 'Use um ORM (Prisma, Sequelize, SQLAlchemy) para interagir com o banco de forma eficiente e segura.', estimatedHours: 5, difficulty: 'Intermediario' },
      { name: 'Autenticacao e autorizacao', description: 'Implemente login, registro, JWT, sessions e controle de acesso a recursos protegidos.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'Validacao e seguranca', description: 'Proteja sua API contra injecao SQL, XSS, CSRF. Implemente validacao de dados e rate limiting.', estimatedHours: 5, difficulty: 'Intermediario' },
      { name: 'Testes automatizados', description: 'Escreva testes unitarios e de integracao. Aprenda TDD e ferramentas como Jest, Vitest ou Pytest.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'Arquitetura e padroes', description: 'Explore padroes como MVC, Repository, Services. Aprenda sobre clean architecture e SOLID.', estimatedHours: 5, difficulty: 'Avancado' },
      { name: 'Deploy e DevOps basico', description: 'Configure CI/CD, Docker, deploy em cloud (AWS, Vercel, Railway). Monitore sua aplicacao.', estimatedHours: 6, difficulty: 'Avancado' },
    ];
  }

  if (topicLower.includes('machine learning') || topicLower.includes('ml') || topicLower.includes('ia')) {
    return [
      { name: 'Fundamentos de Python para ML', description: 'Revise Python com foco em bibliotecas cientificas: NumPy, Pandas, Matplotlib.', estimatedHours: 5, difficulty: 'Iniciante' },
      { name: 'Estatistica e probabilidade', description: 'Distribuicoes, teste de hipotese, correlacao e regressao linear — a base da ML.', estimatedHours: 6, difficulty: 'Iniciante' },
      { name: 'Analise exploratoria de dados', description: 'Aprenda a limpar, visualizar e extrair insights de datasets reais.', estimatedHours: 5, difficulty: 'Iniciante' },
      { name: 'Regressao linear e logistica', description: 'Seu primeiro modelo! Entenda como algoritmos aprendem relacoes nos dados.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'Arvores de decisao e ensemble', description: 'Decision Trees, Random Forest e Gradient Boosting para problemas de classificacao e regressao.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'Avaliacao de modelos', description: 'Metricas: acuracia, precision, recall, F1, ROC-AUC. Overfitting, underfitting e validacao cruzada.', estimatedHours: 4, difficulty: 'Intermediario' },
      { name: 'Introducao ao Deep Learning', description: 'Redes neurais artificiais: perceptron, backpropagation e frameworks como PyTorch ou TensorFlow.', estimatedHours: 8, difficulty: 'Avancado' },
      { name: 'Projeto pratico end-to-end', description: 'Construa um projeto completo: coleta de dados, preprocessamento, treinamento e deploy de um modelo.', estimatedHours: 10, difficulty: 'Avancado' },
    ];
  }

  if (topicLower.includes('dados') || topicLower.includes('data')) {
    return [
      { name: 'Fundamentos de analise de dados', description: 'O que e ciencia de dados, ciclo de vida de um projeto e ferramentas essenciais.', estimatedHours: 3, difficulty: 'Iniciante' },
      { name: 'Python e Pandas', description: 'Manipule DataFrames, limpe dados, faca agregacoes e merge de tabelas com confianca.', estimatedHours: 6, difficulty: 'Iniciante' },
      { name: 'Visualizacao de dados', description: 'Crie graficos eficazes com Matplotlib, Seaborn ou Plotly. Storytelling com dados.', estimatedHours: 5, difficulty: 'Iniciante' },
      { name: 'Estatistica aplicada', description: 'Medidas de tendencia central, dispersao, distribuicoes, correlacao e testes de hipotese.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'SQL avancado', description: 'Joins complexos, window functions, CTEs e otimizacao de queries para analise.', estimatedHours: 5, difficulty: 'Intermediario' },
      { name: 'ETL e pipelines de dados', description: 'Extraia, transforme e carregue dados. Ferramentas como Airflow e dbt.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'Dashboard e comunicacao', description: 'Crie dashboards interativos e aprenda a comunicar insights para stakeholders.', estimatedHours: 5, difficulty: 'Avancado' },
      { name: 'Projeto portfolio', description: 'Construa um portfolio com 2-3 projetos de analise de dados reais com storytelling.', estimatedHours: 10, difficulty: 'Avancado' },
    ];
  }

  if (topicLower.includes('frontend') || topicLower.includes('react') || topicLower.includes('web')) {
    return [
      { name: 'HTML, CSS e responsividade', description: 'Domine a base da web: semantica, Flexbox, Grid e design responsivo.', estimatedHours: 4, difficulty: 'Iniciante' },
      { name: 'JavaScript moderno (ES6+)', description: 'Destructuring, arrow functions, promises, async/await, modules.', estimatedHours: 5, difficulty: 'Iniciante' },
      { name: 'TypeScript fundamentos', description: 'Tipagem estatica, interfaces, generics e configuracao de projetos TS.', estimatedHours: 5, difficulty: 'Iniciante' },
      { name: 'React basico', description: 'Componentes, props, estado, hooks (useState, useEffect) e ciclo de vida.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'React avancado', description: 'Context API, custom hooks, useRef, useMemo, useCallback e padroes avancados.', estimatedHours: 6, difficulty: 'Intermediario' },
      { name: 'Gerenciamento de estado', description: 'Zustand, Redux ou Jotai. Entenda quando e por que usar gerenciamento global de estado.', estimatedHours: 5, difficulty: 'Intermediario' },
      { name: 'Performance e otimizacao', description: 'Code splitting, lazy loading, memoizacao, React Profiler e Core Web Vitals.', estimatedHours: 5, difficulty: 'Avancado' },
      { name: 'Testes e qualidade', description: 'Testing Library, Jest, Cypress. Estrategias de testes para apps React.', estimatedHours: 6, difficulty: 'Avancado' },
      { name: 'Arquitetura de apps', description: 'Clean architecture, feature-based structure, design patterns e escalabilidade.', estimatedHours: 5, difficulty: 'Avancado' },
    ];
  }

  // Generic fallback
  return [
    { name: 'Fundamentos e conceitos basicos', description: 'Entenda os conceitos centrais, terminologia e o panorama geral do tema.', estimatedHours: 4, difficulty: 'Iniciante' },
    { name: 'Primeiros passos praticos', description: 'Coloque a mao na massa: configure o ambiente e crie seu primeiro projeto/exercicio.', estimatedHours: 5, difficulty: 'Iniciante' },
    { name: 'Aprofundamento teorico', description: 'Estude os conceitos intermediarios que formam a base solida do conhecimento.', estimatedHours: 6, difficulty: 'Intermediario' },
    { name: 'Pratica orientada', description: 'Resolva exercicios e desafios praticos para consolidar o aprendizado.', estimatedHours: 6, difficulty: 'Intermediario' },
    { name: 'Projetos reais', description: 'Aplique tudo em projetos praticos que simulem situacoes reais.', estimatedHours: 8, difficulty: 'Intermediario' },
    { name: 'Topicos avancados', description: 'Explore conceitos avancados e tendencias na area.', estimatedHours: 7, difficulty: 'Avancado' },
    { name: 'Revisao e certificacao', description: 'Revise todo o conteudo e prepare-se para uma certificacao ou avaliacao final.', estimatedHours: 5, difficulty: 'Avancado' },
  ];
}

export default RoadmapView;
