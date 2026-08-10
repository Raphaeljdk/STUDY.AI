'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Plus, Sparkles, Loader2, Clock, Zap,
  ChevronDown, ChevronUp, Check, Circle, Play,
  Trophy, ArrowLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ===== TYPES =====
interface MissionStep {
  id: string;
  title: string;
  emoji: string;
  durationMinutes: number;
  completed: boolean;
  description?: string;
}

interface Mission {
  id: string;
  title: string;
  subject: string;
  topic: string;
  totalTimeMinutes: number;
  xpReward: number;
  completedSteps: number;
  totalSteps: number;
  steps: MissionStep[];
  status: 'active' | 'completed' | 'abandoned';
  currentMastery: number;
  targetMastery: number;
  createdAt: string;
  completedAt?: string | null;
  beforeMastery?: number;
}

// ===== TIME OPTIONS =====
const TIME_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

// ===== PROGRESS RING =====
function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  color = 'var(--ws-accent)',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="var(--ws-glass-border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

// ===== MASTERY BAR =====
function MasteryBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] w-14 flex-shrink-0 text-right font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ws-glass-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="text-[10px] w-8 flex-shrink-0 font-bold tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// ===== MISSION CARD =====
function MissionCard({
  mission,
  onClick,
}: {
  mission: Mission;
  onClick: () => void;
}) {
  const progress = mission.totalSteps > 0 ? mission.completedSteps / mission.totalSteps : 0;
  const isComplete = mission.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="hover-lift cursor-pointer"
      onClick={onClick}
    >
      <div
        className="backdrop-blur-xl p-5 transition-ws"
        style={{
          borderRadius: 'var(--ws-radius-card)',
          borderColor: 'var(--ws-glass-border)',
          border: '1px solid var(--ws-glass-border)',
          background: isComplete
            ? 'color-mix(in srgb, rgba(22, 163, 74) 3%, var(--ws-glass))'
            : 'var(--ws-glass)',
          boxShadow: 'var(--ws-shadow-soft)',
        }}
      >
        <div className="flex items-start gap-3.5">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <ProgressRing
              progress={progress}
              size={50}
              strokeWidth={4}
              color={isComplete ? '#16A34A' : 'var(--ws-accent)'}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {isComplete ? (
                <Check className="w-4 h-4" style={{ color: '#16A34A' }} />
              ) : (
                <span className="text-[10px] font-bold" style={{ color: 'var(--ws-text-primary)' }}>
                  {Math.round(progress * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isComplete && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                  style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}
                >
                  Concluida
                </span>
              )}
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{ background: 'color-mix(in srgb, var(--ws-accent) 8%, transparent)', color: 'var(--ws-accent)' }}
              >
                {mission.subject}
              </span>
            </div>
            <h3 className="font-semibold text-[15px] leading-snug mb-1.5 truncate" style={{ color: 'var(--ws-text-primary)' }}>
              {mission.title}
            </h3>

            {/* Progress Bar */}
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--ws-glass-border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isComplete
                    ? '#16A34A'
                    : 'linear-gradient(90deg, var(--ws-accent), color-mix(in srgb, var(--ws-accent) 60%, var(--ws-gold)))',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>

            <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                {mission.completedSteps}/{mission.totalSteps} etapas
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {mission.totalTimeMinutes} min
              </span>
              <span className="flex items-center gap-1 ml-auto font-semibold" style={{ color: 'var(--ws-accent)' }}>
                <Zap className="w-3 h-3" />
                {mission.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== MISSION DETAIL =====
function MissionDetail({
  mission,
  onBack,
  onUpdate,
}: {
  mission: Mission;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [completingStep, setCompletingStep] = useState<string | null>(null);
  const isComplete = mission.status === 'completed';
  const progress = mission.totalSteps > 0 ? mission.completedSteps / mission.totalSteps : 0;

  const handleCompleteStep = async (stepId: string) => {
    setCompletingStep(stepId);
    try {
      await apiFetch(`/api/missions/${mission.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stepId }),
      });
      onUpdate();
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: err.message || 'Erro de conexao. Tente novamente.' });
    } finally {
      setCompletingStep(null);
    }
  };

  const handleCompleteMission = async () => {
    try {
      await apiFetch(`/api/missions/${mission.id}/complete`, { method: 'POST' });
      toast({ title: 'Missao concluida!', description: `+${mission.xpReward} XP ganhos!` });
      onUpdate();
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Tente novamente.' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-5"
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium transition-ws"
        style={{ color: 'var(--ws-text-tertiary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Header */}
      <div
        className="glass-enhanced p-5"
        style={{ borderRadius: 'var(--ws-radius-card)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium mb-2"
              style={{ background: 'color-mix(in srgb, var(--ws-accent) 8%, transparent)', color: 'var(--ws-accent)' }}
            >
              {mission.subject}
            </span>
            <h2 className="font-serif-jp text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
              {mission.title}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--ws-text-secondary)' }}>
              {mission.topic}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <ProgressRing
              progress={progress}
              size={60}
              strokeWidth={5}
              color={isComplete ? '#16A34A' : 'var(--ws-accent)'}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 rounded-ws-button" style={{
            background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
          }}>
            <p className="text-sm font-bold" style={{ color: 'var(--ws-text-primary)' }}>
              {mission.completedSteps}/{mission.totalSteps}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>Etapas</p>
          </div>
          <div className="text-center p-2.5 rounded-ws-button" style={{
            background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
          }}>
            <p className="text-sm font-bold" style={{ color: 'var(--ws-text-primary)' }}>
              {mission.totalTimeMinutes} min
            </p>
            <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>Tempo</p>
          </div>
          <div className="text-center p-2.5 rounded-ws-button" style={{
            background: 'color-mix(in srgb, var(--ws-accent) 6%, transparent)',
          }}>
            <p className="text-sm font-bold" style={{ color: 'var(--ws-accent)' }}>
              +{mission.xpReward} XP
            </p>
            <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>Recompensa</p>
          </div>
        </div>

        {/* Mastery Comparison */}
        {isComplete && mission.beforeMastery !== undefined && (
          <div className="pt-3 border-t" style={{ borderColor: 'var(--ws-glass-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ws-text-tertiary)' }}>
              Dominio
            </p>
            <div className="space-y-2">
              <MasteryBar label="Antes" value={mission.beforeMastery} color="var(--ws-text-tertiary)" />
              <MasteryBar label="Depois" value={mission.currentMastery} color="#16A34A" />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-bold" style={{ color: '#16A34A' }}>
                +{mission.currentMastery - mission.beforeMastery}% de evolucao
              </span>
            </div>
          </div>
        )}

        {!isComplete && mission.targetMastery > 0 && (
          <div className="pt-3 border-t" style={{ borderColor: 'var(--ws-glass-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ws-text-tertiary)' }}>
              Dominio esperado
            </p>
            <div className="space-y-2">
              <MasteryBar label="Atual" value={mission.currentMastery} color="var(--ws-accent)" />
              <MasteryBar label="Objetivo" value={mission.targetMastery} color="var(--ws-gold)" />
            </div>
          </div>
        )}
      </div>

      {/* Steps Checklist */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ws-text-tertiary)' }}>
          Etapas da missao
        </h3>
        <div className="space-y-2">
          {mission.steps.map((step, idx) => {
            const isStepDone = step.completed;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={"flex items-center gap-3 p-3.5 transition-ws"}
                style={{
                  borderRadius: 'var(--ws-radius-button)',
                  background: isStepDone
                    ? 'color-mix(in srgb, rgba(22, 163, 74) 5%, var(--ws-glass))'
                    : 'var(--ws-glass)',
                  border: `1px solid ${isStepDone ? 'rgba(22, 163, 74, 0.15)' : 'var(--ws-glass-border)'}`,
                  opacity: isStepDone ? 0.75 : 1,
                }}
              >
                {/* Step completion */}
                {!isStepDone && !isComplete ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCompleteStep(step.id)}
                    disabled={completingStep === step.id}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-ws"
                    style={{
                      border: '2px solid var(--ws-glass-border)',
                      background: 'transparent',
                    }}
                    aria-label={`Completar: ${step.title}`}
                  >
                    {completingStep === step.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--ws-accent)' }} />
                    ) : (
                      <Circle className="w-3.5 h-3.5" style={{ color: 'var(--ws-text-tertiary)' }} />
                    )}
                  </motion.button>
                ) : (
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(22, 163, 74, 0.15)' }}
                  >
                    <Check className="w-4 h-4" style={{ color: '#16A34A' }} />
                  </div>
                )}

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{step.emoji}</span>
                    <span
                      className="text-sm font-medium truncate"
                      style={{
                        color: isStepDone ? 'var(--ws-text-tertiary)' : 'var(--ws-text-primary)',
                        textDecoration: isStepDone ? 'line-through' : 'none',
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                  {step.description && (
                    <p className="text-[11px] mt-0.5 ml-7" style={{ color: 'var(--ws-text-tertiary)' }}>
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <span
                  className="flex-shrink-0 text-[10px] font-medium px-2 py-1 rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--ws-ink) 5%, transparent)',
                    color: 'var(--ws-text-tertiary)',
                  }}
                >
                  {step.durationMinutes} min
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Complete Mission Button */}
      {!isComplete && mission.completedSteps === mission.totalSteps && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleCompleteMission}
            className="w-full h-12 text-base font-semibold rounded-ws-button"
            style={{
              background: 'var(--ws-accent)',
              color: 'var(--ws-text-on-dark)',
              boxShadow: 'var(--ws-shadow-enso)',
            }}
          >
            <Trophy className="mr-2 h-5 w-5" />
            Concluir missao (+{mission.xpReward} XP)
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== EMPTY STATE =====
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)',
          boxShadow: 'var(--ws-shadow-enso)',
        }}
      >
        <Map className="w-10 h-10" style={{ color: 'var(--ws-accent)' }} />
      </motion.div>
      <h3 className="font-serif-jp text-lg font-bold mb-2" style={{ color: 'var(--ws-text-primary)' }}>
        Nenhuma missao ainda
      </h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--ws-text-secondary)' }}>
        Crie sua primeira missao de estudo com IA e conquiste XP seguindo um plano personalizado.
      </p>
      <Button
        onClick={onGenerate}
        className="h-11 px-6 rounded-ws-button font-semibold"
        style={{
          background: 'var(--ws-accent)',
          color: 'var(--ws-text-on-dark)',
          boxShadow: 'var(--ws-shadow-enso)',
        }}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Criar primeira missao
      </Button>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export function MissionsView({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formSubject, setFormSubject] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formTime, setFormTime] = useState(30);

  const activeMissions = missions.filter((m) => m.status === 'active');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  const fetchMissions = useCallback(async () => {
    try {
      const data = await apiFetch('/api/missions').catch(() => null);
      if (data) {
        setMissions(Array.isArray(data) ? data : data.missions || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const handleCreateMission = async () => {
    if (!formSubject.trim() || !formTopic.trim()) {
      toast({ title: 'Preencha os campos', description: 'Informe a materia e o topico.' });
      return;
    }
    setCreating(true);
    try {
      const data = await apiFetch('/api/missions', {
        method: 'POST',
        body: JSON.stringify({
          subject: formSubject.trim(),
          topic: formTopic.trim(),
          timeAvailable: formTime,
        }),
      });
      setMissions((prev) => [data, ...prev]);
      setShowCreateDialog(false);
      setFormSubject('');
      setFormTopic('');
      setFormTime(30);
      toast({ title: 'Missao criada!', description: data.title || 'Sua missao esta pronta.' });
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro ao criar missao', description: err.message || 'Tente novamente.' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = useCallback(() => {
    fetchMissions();
    // Update selected mission if it exists
    if (selectedMission) {
      const updated = missions.find((m) => m.id === selectedMission.id);
      if (updated) setSelectedMission(updated);
    }
  }, [fetchMissions, missions, selectedMission]);

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const handleBackFromDetail = () => {
    setSelectedMission(null);
  };

  // ===== DETAIL VIEW =====
  if (selectedMission) {
    return (
      <div className="relative min-h-full pb-24">
        <MissionDetail
          mission={selectedMission}
          onBack={handleBackFromDetail}
          onUpdate={handleUpdate}
        />
      </div>
    );
  }

  // ===== MAIN LIST VIEW =====
  return (
    <div className="relative min-h-full pb-24">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif-jp text-2xl font-bold mb-1" style={{ color: 'var(--ws-text-primary)' }}>
            Missoes de Estudo
          </h1>
          <p className="text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
            Planos personalizados de estudo com IA
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-ws flex-shrink-0"
          style={{
            background: 'var(--ws-accent)',
            color: 'var(--ws-text-on-dark)',
            boxShadow: 'var(--ws-shadow-enso)',
          }}
          aria-label="Criar missao"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-5"
              style={{
                borderRadius: 'var(--ws-radius-card)',
                background: 'var(--ws-glass)',
                border: '1px solid var(--ws-glass-border)',
              }}
            >
              <div className="flex gap-3.5">
                <div className="w-12 h-12 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
                  <div className="h-2 w-full rounded-full skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : missions.length === 0 ? (
        <EmptyState onGenerate={() => setShowCreateDialog(true)} />
      ) : (
        <div className="space-y-6">
          {/* Active Missions */}
          {activeMissions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4" style={{ color: 'var(--ws-accent)' }} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
                  Em andamento ({activeMissions.length})
                </h2>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {activeMissions.map((m) => (
                    <MissionCard
                      key={m.id}
                      mission={m}
                      onClick={() => handleSelectMission(m)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <Trophy className="w-4 h-4" style={{ color: '#D97706' }} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
                  Concluidas ({completedMissions.length})
                </h2>
                {showCompleted ? (
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                )}
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-2">
                      {completedMissions.map((m) => (
                        <MissionCard
                          key={m.id}
                          mission={m}
                          onClick={() => handleSelectMission(m)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ===== CREATE MISSION DIALOG ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent
          className="sm:max-w-md rounded-ws-organic border-[var(--ws-glass-border)] bg-[var(--ws-bg)] p-6"
          style={{ boxShadow: 'var(--ws-shadow-medium)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-lg" style={{ color: 'var(--ws-text-primary)' }}>
              <span className="mr-2">🗺️</span>
              Criar Missao de Estudo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Subject */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--ws-text-secondary)' }}
              >
                Materia
              </label>
              <Input
                placeholder="Ex: Java, Matematica, Historia..."
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="h-10 rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)] text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)]"
              />
            </div>

            {/* Topic */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--ws-text-secondary)' }}
              >
                Topico especifico
              </label>
              <Input
                placeholder="Ex: Heranca e Polimorfismo"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                className="h-10 rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)] text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)]"
              />
            </div>

            {/* Time Available */}
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: 'var(--ws-text-secondary)' }}
              >
                Tempo disponivel
              </label>
              <div className="grid grid-cols-5 gap-2">
                {TIME_OPTIONS.map((opt) => {
                  const isActive = formTime === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFormTime(opt.value)}
                      className="py-2.5 text-xs font-medium rounded-ws-button transition-ws"
                      style={{
                        background: isActive
                          ? 'color-mix(in srgb, var(--ws-accent) 10%, transparent)'
                          : 'var(--ws-glass)',
                        border: `1px solid ${isActive
                          ? 'color-mix(in srgb, var(--ws-accent) 30%, transparent)'
                          : 'var(--ws-glass-border)'}`,
                        color: isActive ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="flex-1 rounded-ws-button border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMission}
              disabled={creating}
              className="flex-1 rounded-ws-button font-semibold"
              style={{
                background: 'var(--ws-accent)',
                color: 'var(--ws-text-on-dark)',
              }}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Gerar missao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MissionsView;
