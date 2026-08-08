'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Target,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Clock,
  BookOpen,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PartyPopper,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

// ===== TYPES =====
interface GoalsViewProps {
  onNavigate: (tab: string, data?: any) => void;
}

interface GoalSubject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SUBJECT' | 'EXAM';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  targetValue?: number | null;
  currentValue: number;
  unit?: string | null;
  subjectId?: string | null;
  subject?: GoalSubject | null;
  startDate: string;
  targetDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubjectOption {
  id: string;
  name: string;
  color: string;
  icon: string;
}

type FilterTab = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SUBJECT' | 'EXAM';

// ===== CONSTANTS =====
const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'Todas', icon: <Target className="h-4 w-4" /> },
  { key: 'DAILY', label: 'Diária', icon: <Flame className="h-4 w-4" /> },
  { key: 'WEEKLY', label: 'Semanal', icon: <CalendarDays className="h-4 w-4" /> },
  { key: 'MONTHLY', label: 'Mensal', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'SUBJECT', label: 'Matéria', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'EXAM', label: 'Prova', icon: <Trophy className="h-4 w-4" /> },
];

const TYPE_CONFIG: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  DAILY: { label: 'Diária', colorClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-200' },
  WEEKLY: { label: 'Semanal', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200' },
  MONTHLY: { label: 'Mensal', colorClass: 'text-violet-700', bgClass: 'bg-violet-50 border-violet-200' },
  SUBJECT: { label: 'Matéria', colorClass: 'text-teal-700', bgClass: 'bg-teal-50 border-teal-200' },
  EXAM: { label: 'Prova', colorClass: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-200' },
};

const TYPE_OPTIONS = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'SUBJECT', label: 'Matéria' },
  { value: 'EXAM', label: 'Prova' },
];

const UNIT_SUGGESTIONS = ['minutos', 'tarefas', 'questões', 'páginas', 'sessões', 'capítulos', 'aulas'];

// ===== ANIMATION VARIANTS =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.25 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

// ===== XP CELEBRATION COMPONENT =====
function XPCelebration({ show, goalId }: { show: boolean; goalId: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={goalId}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, -10, -40, -80],
            scale: [0.5, 1.2, 1, 0.8],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-2 left-8 z-50 flex items-center gap-1"
        >
          <motion.span
            initial={{ rotate: -20 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="text-xl font-bold"
            style={{ color: 'var(--ws-accent)' }}
          >
            +50 XP
          </motion.span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PartyPopper className="h-5 w-5" style={{ color: 'var(--ws-gold)' }} />
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== COMPLETION CELEBRATION OVERLAY =====
function CompletionCelebration({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="flex flex-col items-center gap-4 rounded-2xl p-8"
            style={{
              background: 'var(--ws-glass)',
              border: '1px solid var(--ws-glass-border)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
            >
              <Trophy className="h-16 w-16" style={{ color: 'var(--ws-gold)' }} />
            </motion.div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
              Meta concluída!
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
              <span className="text-2xl font-bold" style={{ color: 'var(--ws-accent)' }}>
                +50 XP
              </span>
              <Sparkles className="h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
            </motion.div>
            <p className="text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
              Continue assim, seu progresso é impressionante!
            </p>
            <Button
              onClick={onClose}
              style={{
                background: 'var(--ws-accent)',
                color: 'var(--ws-text-on-dark)',
                borderRadius: 'var(--ws-radius-button)',
              }}
            >
              Continuar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== GOAL FORM DIALOG =====
function GoalFormDialog({
  open,
  onOpenChange,
  subjects,
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType,
  targetValue,
  setTargetValue,
  unit,
  setUnit,
  subjectId,
  setSubjectId,
  targetDate,
  setTargetDate,
  titleError,
  submitting,
  onSubmit,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: SubjectOption[];
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  targetValue: string;
  setTargetValue: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  subjectId: string;
  setSubjectId: (v: string) => void;
  targetDate: string;
  setTargetDate: (v: string) => void;
  titleError: string;
  submitting: boolean;
  onSubmit: () => void;
  isEdit: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{ borderRadius: 'var(--ws-radius-card)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--ws-text-primary)' }}>
            {isEdit ? 'Editar meta' : 'Nova meta'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ws-text-tertiary)' }}>
            {isEdit ? 'Atualize os detalhes da sua meta.' : 'Defina uma meta para acompanhar seu progresso.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="goal-title" style={{ color: 'var(--ws-text-secondary)' }}>
              Título <span style={{ color: 'var(--ws-accent)' }}>*</span>
            </Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Estudar 30 minutos por dia"
              style={{
                borderRadius: 'var(--ws-radius-button)',
                borderColor: titleError ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
              }}
            />
            {titleError && (
              <p className="text-xs" style={{ color: 'var(--ws-accent)' }}>{titleError}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="goal-desc" style={{ color: 'var(--ws-text-secondary)' }}>
              Descrição (opcional)
            </Label>
            <Textarea
              id="goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre a meta..."
              rows={2}
              style={{ borderRadius: 'var(--ws-radius-button)', borderColor: 'var(--ws-glass-border)' }}
            />
          </div>

          {/* Tipo e Valor Alvo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label style={{ color: 'var(--ws-text-secondary)' }}>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger style={{ borderRadius: 'var(--ws-radius-button)' }}>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target" style={{ color: 'var(--ws-text-secondary)' }}>
                Valor alvo
              </Label>
              <Input
                id="goal-target"
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="30"
                style={{ borderRadius: 'var(--ws-radius-button)', borderColor: 'var(--ws-glass-border)' }}
              />
            </div>
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--ws-text-secondary)' }}>Unidade</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger style={{ borderRadius: 'var(--ws-radius-button)' }}>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_SUGGESTIONS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Matéria */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--ws-text-secondary)' }}>Matéria (opcional)</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger style={{ borderRadius: 'var(--ws-radius-button)' }}>
                <SelectValue placeholder="Selecione a matéria" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Alvo */}
          <div className="space-y-2">
            <Label htmlFor="goal-date" style={{ color: 'var(--ws-text-secondary)' }}>
              Data alvo (opcional)
            </Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ borderRadius: 'var(--ws-radius-button)', borderColor: 'var(--ws-glass-border)' }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            style={{ borderRadius: 'var(--ws-radius-button)', borderColor: 'var(--ws-glass-border)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !title.trim()}
            style={{
              background: 'var(--ws-accent)',
              color: 'var(--ws-text-on-dark)',
              borderRadius: 'var(--ws-radius-button)',
              opacity: submitting || !title.trim() ? 0.5 : 1,
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Criar meta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== GOAL CARD =====
function GoalCard({
  goal,
  onComplete,
  onEdit,
  onDelete,
  onUpdateProgress,
}: {
  goal: Goal;
  onComplete: (id: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, value: number) => void;
}) {
  const [showXP, setShowXP] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [progressInput, setProgressInput] = useState(String(goal.currentValue));
  const typeConfig = TYPE_CONFIG[goal.type] || TYPE_CONFIG.DAILY;
  const progressPercent = goal.targetValue
    ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
    : 0;
  const isCompleted = goal.status === 'COMPLETED';
  const isAbandoned = goal.status === 'ABANDONED';

  const handleComplete = () => {
    setShowXP(true);
    onComplete(goal.id);
    setTimeout(() => setShowXP(false), 2000);
  };

  const handleProgressSubmit = () => {
    const val = parseInt(progressInput, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateProgress(goal.id, val);
      setEditingProgress(false);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="group relative"
    >
      <XPCelebration show={showXP} goalId={goal.id} />
      <div
        className="relative overflow-hidden p-4 border transition-all duration-300"
        style={{
          borderRadius: 'var(--ws-radius-card)',
          borderColor: isCompleted
            ? 'color-mix(in srgb, var(--ws-verdigris) 30%, var(--ws-glass-border))'
            : isAbandoned
            ? 'color-mix(in srgb, var(--ws-text-tertiary) 30%, var(--ws-glass-border))'
            : 'var(--ws-glass-border)',
          background: isCompleted
            ? 'color-mix(in srgb, var(--ws-verdigris) 5%, var(--ws-glass))'
            : 'var(--ws-glass)',
          opacity: isAbandoned ? 0.6 : 1,
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleComplete}
            disabled={isCompleted || isAbandoned}
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
            aria-label={isCompleted ? 'Meta já concluída' : 'Concluir meta'}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--ws-verdigris)' }} />
            ) : (
              <Circle className="h-5 w-5" style={{ color: 'var(--ws-text-tertiary)' }} />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-medium text-sm truncate"
                style={{
                  color: 'var(--ws-text-primary)',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}
              >
                {goal.title}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeConfig.bgClass} ${typeConfig.colorClass}`}
              >
                {typeConfig.label}
              </span>
            </div>

            {/* Subject badge */}
            {goal.subject && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: goal.subject.color || 'var(--ws-gold)' }}
                />
                <span className="text-xs truncate" style={{ color: 'var(--ws-text-tertiary)' }}>
                  {goal.subject.name}
                </span>
              </div>
            )}

            {/* Progress bar */}
            {goal.targetValue && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                    Progresso
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
                    {isCompleted ? (
                      <span style={{ color: 'var(--ws-verdigris)' }}>
                        ✓ Concluída
                      </span>
                    ) : editingProgress ? (
                      <input
                        type="number"
                        min="0"
                        value={progressInput}
                        onChange={(e) => setProgressInput(e.target.value)}
                        onBlur={handleProgressSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleProgressSubmit()}
                        className="w-16 rounded px-1 py-0.5 text-xs"
                        style={{
                          background: 'var(--ws-bg)',
                          border: '1px solid var(--ws-glass-border)',
                          color: 'var(--ws-text-primary)',
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setProgressInput(String(goal.currentValue));
                          setEditingProgress(true);
                        }}
                        className="hover:underline"
                        style={{ color: 'var(--ws-text-secondary)' }}
                      >
                        {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
                      </button>
                    )}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--ws-bg-dark)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      background: isCompleted
                        ? 'var(--ws-verdigris)'
                        : progressPercent >= 75
                        ? 'var(--ws-gold)'
                        : progressPercent >= 50
                        ? 'var(--ws-accent)'
                        : 'var(--ws-gold)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Meta info */}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {goal.targetDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" style={{ color: 'var(--ws-text-tertiary)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                    {format(parseISO(goal.targetDate), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              <span className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                Criada {formatDistanceToNow(parseISO(goal.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(goal)}
            disabled={isCompleted}
            className="rounded-md p-1 transition-colors hover:bg-black/5"
            style={{ color: 'var(--ws-text-tertiary)' }}
            aria-label="Editar meta"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="rounded-md p-1 transition-colors hover:bg-black/5"
            style={{ color: 'var(--ws-accent)' }}
            aria-label="Excluir meta"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ===== SKELETON LOADER =====
function GoalsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 border"
          style={{
            borderRadius: 'var(--ws-radius-card)',
            borderColor: 'var(--ws-glass-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== EMPTY STATE =====
function EmptyState({ activeTab }: { activeTab: FilterTab }) {
  const messages: Record<string, { title: string; description: string }> = {
    ALL: {
      title: 'Nenhuma meta encontrada',
      description: 'Crie sua primeira meta para começar a acompanhar seu progresso.',
    },
    DAILY: {
      title: 'Sem metas diárias',
      description: 'Adicione metas diárias para criar hábitos de estudo consistentes.',
    },
    WEEKLY: {
      title: 'Sem metas semanais',
      description: 'Defina objetivos semanais para manter o ritmo de estudos.',
    },
    MONTHLY: {
      title: 'Sem metas mensais',
      description: 'Planeje metas mensais para conquistas de longo prazo.',
    },
    SUBJECT: {
      title: 'Sem metas por matéria',
      description: 'Crie metas específicas para cada disciplina que estuda.',
    },
    EXAM: {
      title: 'Sem metas de prova',
      description: 'Defina metas de preparação para suas próximas provas.',
    },
  };

  const msg = messages[activeTab] || messages.ALL;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}
      >
        <Target className="h-8 w-8" style={{ color: 'var(--ws-accent)' }} />
      </div>
      <h3 className="text-lg font-medium" style={{ color: 'var(--ws-text-primary)' }}>
        {msg.title}
      </h3>
      <p className="mt-1 max-w-xs text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
        {msg.description}
      </p>
    </motion.div>
  );
}

// ===== STATS BAR =====
function StatsBar({ goals }: { goals: Goal[] }) {
  const inProgress = goals.filter((g) => g.status === 'IN_PROGRESS').length;
  const completed = goals.filter((g) => g.status === 'COMPLETED').length;
  const total = goals.length;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Em andamento', value: inProgress, color: 'var(--ws-gold)', icon: <Flame className="h-4 w-4" /> },
        { label: 'Concluídas', value: completed, color: 'var(--ws-verdigris)', icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: 'Total', value: total, color: 'var(--ws-accent)', icon: <Target className="h-4 w-4" /> },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2 rounded-xl p-3 border"
          style={{
            borderColor: 'var(--ws-glass-border)',
            background: 'var(--ws-glass)',
          }}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export function GoalsView({ onNavigate }: GoalsViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DAILY');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [titleError, setTitleError] = useState('');

  // Celebration
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch goals and subjects
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsRes, subjectsRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/subjects'),
      ]);

      if (!goalsRes.ok || !subjectsRes.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const goalsData = await goalsRes.json();
      const subjectsData = await subjectsRes.json();

      setGoals(goalsData.goals || []);
      setSubjects(subjectsData.subjects || []);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as metas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter goals
  const filteredGoals = goals.filter((g) => {
    if (activeTab === 'ALL') return true;
    return g.type === activeTab;
  });

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('DAILY');
    setTargetValue('');
    setUnit('');
    setSubjectId('');
    setTargetDate('');
    setTitleError('');
    setEditingGoal(null);
  };

  // Open form dialog for create
  const openCreateDialog = () => {
    resetForm();
    setFormOpen(true);
  };

  // Open form dialog for edit
  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setType(goal.type);
    setTargetValue(goal.targetValue ? String(goal.targetValue) : '');
    setUnit(goal.unit || '');
    setSubjectId(goal.subjectId || '');
    setTargetDate(goal.targetDate ? format(parseISO(goal.targetDate), 'yyyy-MM-dd') : '');
    setTitleError('');
    setFormOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError('Título é obrigatório');
      return;
    }

    try {
      setSubmitting(true);

      const body: any = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        targetValue: targetValue ? parseInt(targetValue, 10) : null,
        unit: unit || null,
        subjectId: subjectId || null,
        targetDate: targetDate || null,
      };

      if (editingGoal) {
        // Update
        const res = await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Erro ao atualizar meta');
        const data = await res.json();
        toast({ title: 'Meta atualizada', description: 'Suas alterações foram salvas.' });
        // Check if XP was awarded
        if (data.xpAwarded) {
          setShowCelebration(true);
        }
      } else {
        // Create
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Erro ao criar meta');
        toast({ title: 'Meta criada!', description: 'Sua nova meta foi adicionada.' });
      }

      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a meta.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Complete goal
  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!res.ok) throw new Error('Erro ao concluir meta');

      const data = await res.json();
      fetchData();

      if (data.xpAwarded) {
        setShowCelebration(true);
        toast({
          title: 'Parabéns! 🎉',
          description: 'Meta concluída! +50 XP ganho.',
        });
      }
    } catch (error) {
      console.error('Erro ao concluir meta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a meta.',
        variant: 'destructive',
      });
    }
  };

  // Update progress
  const handleUpdateProgress = async (id: string, value: number) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: value }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar progresso');

      const data = await res.json();
      fetchData();

      if (data.xpAwarded) {
        setShowCelebration(true);
        toast({
          title: 'Meta concluída! 🎉',
          description: 'Você atingiu o objetivo! +50 XP ganho.',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o progresso.',
        variant: 'destructive',
      });
    }
  };

  // Delete goal
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/goals/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir meta');

      setGoals((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
      toast({ title: 'Meta excluída', description: 'A meta foi removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a meta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-6" aria-label="Metas">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
            Metas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ws-text-tertiary)' }}>
            Acompanhe e conquiste seus objetivos de estudo
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="flex items-center gap-2"
          style={{
            background: 'var(--ws-accent)',
            color: 'var(--ws-text-on-dark)',
            borderRadius: 'var(--ws-radius-button)',
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova meta</span>
        </Button>
      </motion.div>

      {/* Stats */}
      {!loading && goals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <StatsBar goals={goals} />
        </motion.div>
      )}

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: activeTab === tab.key ? 'var(--ws-accent)' : 'transparent',
                color: activeTab === tab.key ? 'var(--ws-text-on-dark)' : 'var(--ws-text-tertiary)',
                border: activeTab === tab.key ? 'none' : '1px solid var(--ws-glass-border)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Goals List */}
      {loading ? (
        <GoalsSkeleton />
      ) : filteredGoals.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onComplete={handleComplete}
                onEdit={openEditDialog}
                onDelete={setDeleteId}
                onUpdateProgress={handleUpdateProgress}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Goal Dialog */}
      <GoalFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
        subjects={subjects}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        type={type}
        setType={setType}
        targetValue={targetValue}
        setTargetValue={setTargetValue}
        unit={unit}
        setUnit={setUnit}
        subjectId={subjectId}
        setSubjectId={setSubjectId}
        targetDate={targetDate}
        setTargetDate={setTargetDate}
        titleError={titleError}
        submitting={submitting}
        onSubmit={handleSubmit}
        isEdit={!!editingGoal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={{ borderRadius: 'var(--ws-radius-card)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--ws-text-primary)' }}>
              Excluir meta?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--ws-text-tertiary)' }}>
              Esta ação não pode ser desfeita. A meta será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderRadius: 'var(--ws-radius-button)' }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                background: 'var(--ws-accent)',
                color: 'var(--ws-text-on-dark)',
                borderRadius: 'var(--ws-radius-button)',
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Completion Celebration Overlay */}
      <CompletionCelebration
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </section>
  );
}
