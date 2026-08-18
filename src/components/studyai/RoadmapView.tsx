// @ts-nocheck
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
  if (d.includes('fundamental')) return 'var(--ws-verdigris)';
  if (d.includes('intermediari')) return 'var(--ws-gold)';
  if (d.includes('avancad')) return 'var(--ws-accent)';
  if (d.includes('especialista')) return '#e11d48';
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
      // Call AI to generate senior-level steps
      let steps: RoadmapStep[];
      try {
        const data = await apiFetch('/api/roadmaps/generate', {
          method: 'POST',
          body: JSON.stringify({ topic: topic.trim() }),
        });
        steps = data.steps;
      } catch {
        // Fallback to local generation if AI fails
        steps = generateDefaultSteps(topic);
      }

      await apiFetch('/api/roadmaps', {
        method: 'POST',
        body: JSON.stringify({
          title: `Trilha: ${topic.trim()}`,
          topic: topic.trim(),
          description: `Plano de estudo gerado por IA para ${topic.trim()}`,
          steps,
          isAI: true,
        }),
      });
      toast({ title: 'Trilha criada!', description: 'Sua trilha de aprendizagem foi gerada com IA.' });
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
      // Call AI to generate senior-level steps
      let steps: RoadmapStep[];
      try {
        const data = await apiFetch('/api/roadmaps/generate', {
          method: 'POST',
          body: JSON.stringify({ topic: suggestion.topic }),
        });
        steps = data.steps;
      } catch {
        // Fallback to local generation if AI fails
        steps = generateDefaultSteps(suggestion.topic);
      }

      await apiFetch('/api/roadmaps', {
        method: 'POST',
        body: JSON.stringify({
          title: suggestion.title,
          topic: suggestion.topic,
          description: suggestion.description,
          steps,
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

// ===== HELPER: Generate detailed senior-level steps for suggested roadmaps =====
function generateDefaultSteps(topic: string): RoadmapStep[] {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes('backend') || topicLower.includes('desenvolvimento')) {
    return [
      { name: 'Protocolos de Rede e Arquitetura HTTP/2', description: 'Aprofunde-se nos fundamentos da comunicacao em rede: modelo OSI, TCP/IP, handshakes TLS 1.3, HTTP/2 multiplexing, server push e HPACK header compression. Entenda connection pooling keep-alive e como otimizar latencia em conexoes de alta concorrencia. Compare WebSocket, SSE e long-polling para comunicacao em tempo real.', estimatedHours: 6, difficulty: 'Fundamental' },
      { name: 'Node.js Runtime Internals e Event Loop', description: 'Domine o event loop do libuv, microtask queue vs macrotask queue, nextTick, setImmediate e a interacao com o thread pool do C++. Entenda worker_threads para CPU-bound operations, SharedArrayBuffer para comunicacao inter-thread, e como profilear memory leaks com heap snapshots e Chrome DevTools.', estimatedHours: 10, difficulty: 'Fundamental' },
      { name: 'Design de APIs RESTful e GraphQL Avancado', description: 'Va alem do CRUD: implemente HATEOAS, cursor-based pagination, sparse fieldsets, filtering avancado com operadores compostos e sorting multi-campo. Para GraphQL, domine schema stitching, federation, DataLoader para N+1, persisted queries e rate limiting por complexidade de query.', estimatedHours: 12, difficulty: 'Intermediario' },
      { name: 'Banco de Dados: Modelagem Avancada e Performance Tuning', description: 'Domine normalizacao ate 5NF, denormalizacao estrategica para leituras de alta performance, partitioning horizontal e vertical, sharding strategies. Aprenda a analisar query execution plans, identificar full table scans, configurar indices compostos cobrindo e partial indexes. Explore CTEs recursivas, window functions e materialized views.', estimatedHours: 14, difficulty: 'Intermediario' },
      { name: 'ORM Avancado: Prisma, Query Optimization e Transactions', description: 'Configure Prisma com connection pooling (PgBouncer), implemente transacoes distribuidas com saga pattern, use interactive transactions para consistencia de dados. Domine eager vs lazy loading, query deduplication, middlewares Prisma para soft-delete e audit logs. Implemente migrations zero-downtime com expand/rename.', estimatedHours: 10, difficulty: 'Intermediario' },
      { name: 'Autenticacao OAuth2/OIDC e Seguranca em Profundidade', description: 'Implemente Authorization Code Flow com PKCE, Refresh Token Rotation, JWT com JWE (encrypted), JWKS key rotation. Configure RBAC granular com ABAC (Attribute-Based Access Control), implemente CSRF double-submit cookie, CORS strict, CSP nonce-based, e helmet.js. Entenda OAuth2 token introspection e revogacao.', estimatedHours: 12, difficulty: 'Avancado' },
      { name: 'Testes: Estrategias de Cobertura e Contratos', description: 'Implemente testes de contrato com Pact ou Dredd para garantir compatibilidade entre microsservicos. Use testes de propriedade com fast-check para gerar inputs aleatorios. Configure mutation testing com Stryker para medir a qualidade real dos testes. Domine testes de integracao com containers Docker efemeros e testes E2E com Playwright.', estimatedHours: 10, difficulty: 'Avancado' },
      { name: 'Clean Architecture e Domain-Driven Design', description: 'Estruture seu codigo com boundaries claros: Entities, Use Cases, Controllers e Infrastructure. Implemente Aggregate Roots, Value Objects, Domain Events e Repositories com CQRS. Separe comandos de queries, use Event Sourcing para auditabilidade e implemente Inversion of Control com dependency injection.', estimatedHours: 12, difficulty: 'Avancado' },
      { name: 'Observabilidade: Logs Estruturados, Tracing e Metrics', description: 'Implemente distributed tracing com OpenTelemetry, crie dashboards de metricas com Prometheus/Grafana. Configure structured logging com correlation IDs para rastrear requisicoes entre servicos. Implemente health checks granulares, circuit breakers com resilience4j, e rate limiting adaptativo.', estimatedHours: 10, difficulty: 'Avancado' },
      { name: 'CI/CD, Containerizacao e Orquestracao Kubernetes', description: 'Domine Docker multi-stage builds para imagens otimizadas, implemente Kubernetes deployments com rolling updates, HPA e PDB. Configure ArgoCD para GitOps, Helm charts para configuracao reutilizavel, e service mesh com Istio para mTLS, traffic shifting e observabilidade. Implemente canary deployments e feature flags.', estimatedHours: 16, difficulty: 'Especialista' },
      { name: 'Arquitetura de Microsservicos: Event-Driven e SAGA', description: 'Projete microsservicos com bounded contexts bem definidos, implemente communication patterns: async com message brokers (RabbitMQ/Kafka) com dead letter queues e exactly-once semantics. Implemente SAGA orchestration e choreography, event sourcing com CQRS, e schema evolution com Apache Avro ou Protobuf.', estimatedHours: 18, difficulty: 'Especialista' },
    ];
  }

  if (topicLower.includes('machine learning') || topicLower.includes('ml') || topicLower.includes('ia')) {
    return [
      { name: 'Python Avancado para Cientistas de Dados', description: 'Domine generators, decorators, descriptors, metaclasses e context managers. Otimize performance com numba JIT compilation, multiprocessing, asyncio e Cython. Implemente type hints avancados com Protocol, TypedDict e Generic. Use dataclasses e pydantic para validacao de schemas complexos.', estimatedHours: 8, difficulty: 'Fundamental' },
      { name: 'Algebra Linear e Calculo Numerico Aplicado', description: 'Aprofunde-se em decomposicao SVD, autovalores/autovetores para PCA, gradient computation com autograd. Entenda condicionamento numerico, metodos iterativos (conjugate gradient, GMRES) e como evitar overflow/underflow em log-space. Implemente tudo com NumPy broadcasting e einsum.', estimatedHours: 10, difficulty: 'Fundamental' },
      { name: 'Probabilidade Bayesiana e Inferencia Estatistica', description: 'Domine teorema de Bayes aplicado, prioris conjugados, MCMC (Metropolis-Hastings, HMC, NUTS) com PyMC. Implemente modelos hierarquicos bayesianos, compare modelos com WAIC e LOO-CV. Entenda hypothesis testing frequentista vs bayesiano, e intervalos de credibilidade vs confianca.', estimatedHours: 12, difficulty: 'Intermediario' },
      { name: 'Feature Engineering Avancado e Pipelines', description: 'Implemente feature stores com Feast, encoding de variaveis categoricas com target encoding smoothing, feature crosses e polynomial features. Use PCA, t-SNE e UMAP para reducao de dimensionalidade. Automatize pipelines com scikit-learn Pipelines e ColumnTransformer. Domine tratamento de dados desbalanceados com SMOTE e class weights.', estimatedHours: 10, difficulty: 'Intermediario' },
      { name: 'Ensemble Methods e Gradient Boosting em Profundidade', description: 'Entenda a matematica por tras de gradient boosting: gradient descent em funcao de perda, regularizacao L1/L2, shrinkage e stochastic gradient boosting. Compare XGBoost, LightGBM e CatBoost. Domine hyperparameter tuning com Optuna, implemente early stopping e calibration de probabilidades com Platt scaling e isotonic regression.', estimatedHours: 12, difficulty: 'Intermediario' },
      { name: 'Deep Learning: Backpropagation, Regularizacao e Otimizacao', description: 'Derive backpropagation manualmente para redes fully-connected. Implemente regularization avancada: dropout, batch norm, layer norm, weight decay e data augmentation. Compare otimizadores (SGD+momentum, Adam, AdamW, Lion) e entenda learning rate schedules (cosine annealing, warmup). Use PyTorch autograd para custom loss functions.', estimatedHours: 14, difficulty: 'Avancado' },
      { name: 'Arquiteturas de Redes Neurais Modernas', description: 'Implemente ResNet com skip connections, Attention mechanism do zero, Transformers com multi-head self-attention e positional encoding. Domine CNNs para visao computacional (ResNeXt, EfficientNet), RNNs/LSTMs para sequencias, e Graph Neural Networks. Entenda transfer learning, fine-tuning strategies e model distillation.', estimatedHours: 16, difficulty: 'Avancado' },
      { name: 'NLP com Transformers e LLMs', description: 'Domine tokenization (BPE, WordPiece, SentencePiece), implemente fine-tuning de BERT/GPT com LoRA e QLoRA para efficient fine-tuning. Entenda RLHF, DPO e constitutional AI. Use LangChain ou LlamaIndex para RAG com vector databases (Pinecone, Weaviate). Implemente evaluation com RAGAS e HumanEval.', estimatedHours: 16, difficulty: 'Avancado' },
      { name: 'MLOps: Treinamento, Versionamento e Deploy de Modelos', description: 'Implemente experiment tracking com MLflow, versionamento de datasets com DVC e modelos com model registry. Configure training pipelines com Kubeflow ou ZenML. Domine model serving com Triton Inference Server, ONNX Runtime e TensorRT para otimizacao de inferencia. Implemente A/B testing de modelos e monitoring de data drift.', estimatedHours: 14, difficulty: 'Especialista' },
      { name: 'Projeto End-to-End: Do Problema de Negocio ao Deploy', description: 'Construa um pipeline completo: definicao do problema de negocio, coleta e limpeza de dados, EDA com dashboards interativos, feature engineering, model selection com cross-validation estratificado, treinamento com hyperparameter optimization, deploy com API REST, monitoring e documentacao tecnica.', estimatedHours: 20, difficulty: 'Especialista' },
    ];
  }

  if (topicLower.includes('dados') || topicLower.includes('data')) {
    return [
      { name: 'Fundamentos de Engenharia de Dados e Data Mesh', description: 'Entenda o paradigma Data Mesh: domain ownership, data as a product, self-serve data platform e federated computational governance. Compare com Data Lakehouse architecture (Delta Lake, Apache Iceberg, Apache Hudi). Projete a arquitetura de um data platform moderno com separacao clara entre ingestion, processing, storage e serving.', estimatedHours: 8, difficulty: 'Fundamental' },
      { name: 'Python para Data Engineering: Pandas, Polars e DuckDB', description: 'Otimize transformacoes de dados com Polars (lazy evaluation, parallel execution) e DuckDB para queries SQL analiticas diretamente em arquivos Parquet. Domine Pandas advanced: groupby multi-level, pivot tables, window functions com rolling e expanding, e integracao com PyArrow para zero-copy reads. Implemente data validation com Great Expectations ou Pandera.', estimatedHours: 12, difficulty: 'Fundamental' },
      { name: 'SQL Avancado: Window Functions e Performance', description: 'Domine window functions (ROW_NUMBER, RANK, LAG/LEAD, FIRST_VALUE) com frames complexos. Implemente recursive CTEs para hierarquias, materialized views para query caching, e particionamento de tabelas. Otimize query plans com ANALYZE, entenda hash join vs merge join vs nested loop, e configure work_mem e parallel workers.', estimatedHours: 10, difficulty: 'Intermediario' },
      { name: 'Batch Processing com Apache Spark', description: 'Configure Spark com cluster managers (YARN, K8s), otimize shuffle partitions e memory management. Implemente ETL robustos com Spark SQL, DataFrame API e Structured Streaming. Entenda execution plans com Spark UI, configure dynamic allocation e implemente write-ahead logs para exactly-once processing. Compare com Flink para streaming use cases.', estimatedHours: 14, difficulty: 'Intermediario' },
      { name: 'Streaming e Processamento de Eventos em Tempo Real', description: 'Implemente pipelines com Apache Kafka: producers com idempotence e compression, consumers com consumer groups e rebalancing. Configure Kafka Connect para source/sink connectors, use Kafka Streams ou ksqlDB para stream processing com windowed aggregations e join streams-tables. Entenda exactly-once semantics e schema registry.', estimatedHours: 14, difficulty: 'Avancado' },
      { name: 'Data Orchestration: Airflow, Dagster e dbt', description: 'Projete DAGs no Airflow com TaskFlow API, implemente custom operators e sensors. Use dbt para transformacoes SQL com versionamento, testes de dados, documentation generation e incremental models. Migre para Dagster para asset-based orchestration com software-defined assets, partitions e backfills.', estimatedHours: 12, difficulty: 'Avancado' },
      { name: 'Data Quality, Lineage e Governanca', description: 'Implemente data quality frameworks com Great Expectations: suites de validacao, data docs e alerting. Configure data lineage com OpenLineage para rastrear dependencias entre datasets. Projete governanca com data catalogs (DataHub, Apache Atlas), implemente PII detection e masking automatizado, e configure RBAC no data platform.', estimatedHours: 10, difficulty: 'Avancado' },
      { name: 'Visualizacao de Dados e Storytelling Avancado', description: 'Crie dashboards interativos com Plotly Dash ou Streamlit com callbacks reativos. Domine principios de visualizacao: pre-attentive attributes, Gestalt principles, chart selection framework. Implemente custom themes, embeddable components e real-time updates. Aprenda a contar historias com dados: contexto, narrativa e call-to-action.', estimatedHours: 10, difficulty: 'Avancado' },
      { name: 'Projeto Portfolio: Data Platform End-to-End', description: 'Construa um data platform completo: ingestion de multiplas fontes (APIs, databases, files), processamento batch e streaming, data warehouse com dbt models, dashboards de monitoramento, data quality checks automatizados, CI/CD com GitHub Actions, e documentacao tecnica com arquitetura e decisoes de design justificadas.', estimatedHours: 20, difficulty: 'Especialista' },
    ];
  }

  if (topicLower.includes('frontend') || topicLower.includes('react') || topicLower.includes('web')) {
    return [
      { name: 'Fundamentos do DOM e Rendering Pipeline', description: 'Entenda como o navegador renderiza: HTML parsing -> DOM -> CSSOM -> Render Tree -> Layout -> Paint -> Composite. Domine reflow vs repaint, compositing layers, will-change e GPU acceleration. Implemente IntersectionObserver para lazy loading, ResizeObserver para responsive components e MutationObserver para integracoes de terceiros.', estimatedHours: 8, difficulty: 'Fundamental' },
      { name: 'JavaScript: Closures, Prototypes e Event Loop Avancado', description: 'Domine closures para encapsulamento e factory functions, entenda prototype chain e como `new` funciona por baixo. Implemente event-driven patterns com EventEmitter, use WeakMap/WeakSet para memory-safe caching, e Proxy/Reflect para metaprogramacao. Entenda microtasks (Promise, queueMicrotask) vs macrotasks (setTimeout, MessageChannel).', estimatedHours: 10, difficulty: 'Fundamental' },
      { name: 'TypeScript Avancado: Generics, Utility Types e Type Guards', description: 'Domine generics com constraints, conditional types, mapped types e template literal types. Implemente branded types para type-safe IDs, use discriminated unions para state machines, e crie utility types customizadas. Configure tsconfig strict mode com todos os checks, use satisfies operator e const assertions para maximum type safety.', estimatedHours: 10, difficulty: 'Intermediario' },
      { name: 'React Internals: Fiber, Reconciliation e Concurrent Features', description: 'Entenda a arquitetura Fiber: work units, lanes de prioridade, interruptible rendering. Domine Suspense para data fetching com React Query/SWR, implemente error boundaries granulares, useTransition para atualizacoes nao-urgentes e useDeferredValue para listas grandes. Otimize re-renders com React.memo, useMemo e useCallback com profiling.', estimatedHours: 14, difficulty: 'Intermediario' },
      { name: 'State Management Arquitetural', description: 'Compare e implemente: Zustand (atomic store com selectors), Jotai (atomic model), e Redux Toolkit com RTK Query para server state. Entenda quando usar cada abordagem: local state, lifted state, context, external store. Implemente optimistic updates, cache invalidation strategies e state persistence com hydration.', estimatedHours: 10, difficulty: 'Intermediario' },
      { name: 'CSS Architecture: Design Systems e Tailwind Avancado', description: 'Crie um design system com design tokens CSS custom properties, implemente component variants com data-attributes e CSS layers. Domine Tailwind: custom plugins, JIT optimization, purge strategies, e integracao com theme switching. Implemente responsive design com container queries, subgrid e :has() selector para parent-based styling.', estimatedHours: 8, difficulty: 'Avancado' },
      { name: 'Performance e Core Web Vitals', description: 'Otimize LCP com preload/preconnect, font display swap e server-side rendering. Reduza FID com code splitting dinamico, React.lazy com Suspense fallbacks, e web workers para offloading. Melhore CLS com dimensionamento explicito de imagens e fontes, e use Layout Shift Tracker. Configure Service Worker com Workbox para offline-first e precaching estrategico.', estimatedHours: 12, difficulty: 'Avancado' },
      { name: 'Testes: Strategy, Patterns e E2E com Playwright', description: 'Implemente testing pyramid: unitarios com vitest, integracao com Testing Library (queries acessiveis, user-event), e E2E com Playwright (page objects, fixtures, parallel execution). Use MSW (Mock Service Worker) para mockar APIs sem interferir no codigo. Implemente visual regression testing com screenshots e diff detection.', estimatedHours: 12, difficulty: 'Avancado' },
      { name: 'Next.js App Router: Server Components e Edge', description: 'Domine Server Components vs Client Components, implemente streaming com Suspense boundaries, parallel routes e intercepting routes. Configure middleware para auth/routing, use route handlers para API logic. Otimize com ISR, static generation e edge runtime. Implemente authentication com NextAuth.js e data fetching com server actions.', estimatedHours: 14, difficulty: 'Avancado' },
      { name: 'Arquitetura e Deploy: Monorepo e CI/CD', description: 'Configure monorepo com Turborepo ou Nx: shared packages, task pipelines e remote caching. Implemente CI/CD com GitHub Actions: lint, type-check, test, build, preview e deploy. Configure Vercel com edge functions, environment secrets e analytics. Implemente feature flags com LaunchDarkly e error monitoring com Sentry.', estimatedHours: 14, difficulty: 'Especialista' },
    ];
  }

  // Generic fallback — also senior-level
  return [
    { name: 'Fundamentos Solidos e Contexto da Area', description: 'Construa uma base tecnica robusta: entenda os conceitos fundamentais, a historia e evolucao da area, e como ela se conecta com outras disciplinas. Mapeie as principais ferramentas, frameworks e comunidades. Identifique os pre-requisitos tecnicos e configure seu ambiente de desenvolvimento profissional.', estimatedHours: 8, difficulty: 'Fundamental' },
    { name: 'Conceitos Core e Abstracoes Principais', description: 'Aprofunde-se nos conceitos centrais que formam a espinha dorsal da area. Entenda nao apenas o que sao, mas POR QUE existem, quais problemas resolvem e quais tradeoffs envolvem. Implemente os padroes basicos do zero para construir intuicao solida antes de usar abstracoes de alto nivel.', estimatedHours: 10, difficulty: 'Fundamental' },
    { name: 'Ferramentas e Ecossistema Profissional', description: 'Domine as ferramentas que profissionais seniores usam diariamente: IDE avancado, debugger, profiler, version control com Git flow e conventional commits. Configure linting, formatting, pre-commit hooks e CI basico. Entenda package management, lock files e dependency resolution.', estimatedHours: 8, difficulty: 'Intermediario' },
    { name: 'Padroes de Projeto e Arquitetura', description: 'Estude e implemente os padroes de projeto mais relevantes para a area: creational, structural e behavioral. Entenda principios SOLID, DRY, KISS e YAGNI na pratica. Projete sistemas modulares com baixo acoplamento e alta coesao. Aplique dependency inversion e open/closed principle em projetos reais.', estimatedHours: 12, difficulty: 'Intermediario' },
    { name: 'Pratica Avancada com Projetos Realistas', description: 'Construa projetos que simulam complexidade real: lidar com dados reais (sujos, incompletos, desbalanceados), implementar error handling robusto, logging estruturado e monitoring. Documente decisoes de arquitetura com ADRs (Architecture Decision Records) e escreva documentacao tecnica de qualidade.', estimatedHours: 16, difficulty: 'Avancado' },
    { name: 'Topicos de Ponta e Tendencias', description: 'Explore as fronteiras do conhecimento na area: leia papers recentes, experimente novas ferramentas e frameworks em beta. Entenda o roadmap de evolucao tecnologica e posicione-se estrategicamente. Contribua para open source ou escreva artigos tecnicos para consolidar e compartilhar conhecimento.', estimatedHours: 14, difficulty: 'Avancado' },
    { name: 'Especializacao e Certificacao', description: 'Escolha uma sub-area para especializacao profunda. Prepare-se para certificacoes reconhecidas na industria com simulados praticos. Construa um estudo de caso completo que demonstre dominio senior: da concepcao a implementacao, passando por decisoes de tradeoff, otimizacao e documentacao.', estimatedHours: 16, difficulty: 'Especialista' },
  ];
}

export default RoadmapView;
