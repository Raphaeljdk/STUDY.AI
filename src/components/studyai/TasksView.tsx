'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Flag,
  Plus,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { apiFetch, ApiError } from '@/lib/api';

// ===== TYPES =====
interface TasksViewProps {
  onNavigate: (tab: string, data?: any) => void;
}

interface TaskSubject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  subject?: TaskSubject | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  sortOrder: number;
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

type FilterTab = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type SortKey = 'dueDate' | 'priority' | 'createdAt' | 'title';
type SortDir = 'asc' | 'desc';

// ===== CONSTANTS =====
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'IN_PROGRESS', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'Concluidas' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; weight: number }> = {
  LOW: { label: 'Baixa', color: '#10b981', weight: 0 },
  MEDIUM: { label: 'Media', color: '#f59e0b', weight: 1 },
  HIGH: { label: 'Alta', color: '#ef4444', weight: 2 },
  URGENT: { label: 'Urgente', color: '#f97316', weight: 3 },
};

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluida' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const PRIORITY_EMOJI: Record<string, string> = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🔴',
  URGENT: '⚡',
};

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
function XPCelebration({ show, taskId }: { show: boolean; taskId: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={taskId}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, -10, -40, -80],
            scale: [0.5, 1.2, 1, 0.8],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-2 left-8 z-50 flex items-center gap-1"
        >
          <motion.span
            initial={{ rotate: -20 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="text-xl font-bold"
            style={{ color: 'var(--ws-accent)' }}
          >
            +30 XP
          </motion.span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Sparkles className="h-5 w-5" style={{ color: 'var(--ws-gold)' }} />
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== TASK FORM DIALOG =====
function TaskFormDialog({
  open,
  onOpenChange,
  subjects,
  title,
  setTitle,
  description,
  setDescription,
  subjectId,
  setSubjectId,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  estimatedMinutes,
  setEstimatedMinutes,
  status,
  setStatus,
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
  subjectId: string;
  setSubjectId: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  estimatedMinutes: string;
  setEstimatedMinutes: (v: string) => void;
  status?: string;
  setStatus?: (v: string) => void;
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
            {isEdit ? 'Editar tarefa' : 'Nova tarefa'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ws-text-tertiary)' }}>
            {isEdit ? 'Altere os dados da tarefa abaixo.' : 'Preencha os dados para criar sua tarefa.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Titulo */}
          <div className="space-y-2">
            <Label htmlFor="task-title" style={{ color: 'var(--ws-text-secondary)' }}>
              Titulo <span style={{ color: 'var(--ws-accent)' }}>*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="Ex: Resumir capitulo 5 de Historia"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(''); }}
              style={{ borderRadius: 'var(--ws-radius-button)' }}
              autoFocus
            />
            {titleError && (
              <p className="text-xs" style={{ color: 'var(--ws-accent)' }}>{titleError}</p>
            )}
          </div>

          {/* Descricao */}
          <div className="space-y-2">
            <Label htmlFor="task-desc" style={{ color: 'var(--ws-text-secondary)' }}>
              Descricao
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Detalhes sobre a tarefa (opcional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ borderRadius: 'var(--ws-radius-button)' }}
            />
          </div>

          {/* Materia */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--ws-text-secondary)' }}>Materia</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger
                className="w-full"
                style={{ borderRadius: 'var(--ws-radius-button)' }}
              >
                <SelectValue placeholder="Selecionar materia (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {subjects.length === 0 && (
                  <SelectItem value="_none" disabled>
                    Nenhuma materia cadastrada
                  </SelectItem>
                )}
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade + Status (edit only) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label style={{ color: 'var(--ws-text-secondary)' }}>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger style={{ borderRadius: 'var(--ws-radius-button)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {PRIORITY_EMOJI[p.value]} {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isEdit && setStatus && status !== undefined && (
              <div className="space-y-2">
                <Label style={{ color: 'var(--ws-text-secondary)' }}>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger style={{ borderRadius: 'var(--ws-radius-button)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Data de entrega + Tempo estimado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-due" style={{ color: 'var(--ws-text-secondary)' }}>
                Data de entrega
              </Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ borderRadius: 'var(--ws-radius-button)' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-time" style={{ color: 'var(--ws-text-secondary)' }}>
                Tempo estimado (min)
              </Label>
              <Input
                id="task-time"
                type="number"
                min={1}
                placeholder="Ex: 45"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                style={{ borderRadius: 'var(--ws-radius-button)' }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            style={{ borderRadius: 'var(--ws-radius-button)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            style={{
              background: 'var(--ws-accent)',
              color: 'var(--ws-text-on-dark)',
              borderRadius: 'var(--ws-radius-button)',
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alteracoes' : 'Criar tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN COMPONENT =====
export default function TasksView({ onNavigate: _onNavigate }: TasksViewProps) {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [xpCelebrationTaskId, setXpCelebrationTaskId] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formDueDate, setFormDueDate] = useState('');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState('');
  const [formStatus, setFormStatus] = useState('PENDING');
  const [formTitleError, setFormTitleError] = useState('');

  // ===== FETCH =====
  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'ALL') {
        params.set('status', activeFilter);
      }
      const data = await apiFetch(`/api/tasks?${params.toString()}`);
      setTasks(data.tasks || []);
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel carregar as tarefas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await apiFetch('/api/subjects');
      setSubjects(
        (data.subjects || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          icon: s.icon,
        }))
      );
    } catch {
      // subjects are optional
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ===== HELPERS =====
  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormDescription('');
    setFormSubjectId('');
    setFormPriority('MEDIUM');
    setFormDueDate('');
    setFormEstimatedMinutes('');
    setFormStatus('PENDING');
    setFormTitleError('');
  }, []);

  const openEditDialog = useCallback((task: Task) => {
    setTaskToEdit(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormSubjectId(task.subjectId || '');
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setFormEstimatedMinutes(task.estimatedMinutes?.toString() || '');
    setFormStatus(task.status);
    setFormTitleError('');
    setEditDialogOpen(true);
  }, []);

  const formatDueDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isPast(date)) return 'Atrasada';
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return '';
    }
  };

  const isOverdue = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return isPast(date) && !isToday(date);
    } catch {
      return false;
    }
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  // ===== SORT & FILTER =====
  const filteredAndSorted = tasks
    .filter((t) => {
      if (activeFilter === 'ALL') return true;
      return t.status === activeFilter;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'dueDate': {
          const aD = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
          const bD = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
          cmp = aD - bD;
          break;
        }
        case 'priority':
          cmp = (PRIORITY_CONFIG[a.priority]?.weight || 0) - (PRIORITY_CONFIG[b.priority]?.weight || 0);
          break;
        case 'createdAt':
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title, 'pt-BR');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const taskCounts = {
    ALL: tasks.length,
    PENDING: tasks.filter((t) => t.status === 'PENDING').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED').length,
  };

  // ===== HANDLERS =====
  const handleToggleComplete = async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const isCompleting = newStatus === 'COMPLETED';
    if (isCompleting) setCompletingTaskId(task.id);

    try {
      const data = await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));

      if (isCompleting && data.xpAwarded) {
        setXpCelebrationTaskId(task.id);
        toast({ title: 'Tarefa concluida!', description: '+30 XP ganhos. Parabens pelo foco!' });
        setTimeout(() => setXpCelebrationTaskId(null), 2000);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel atualizar a tarefa.', variant: 'destructive' });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleStartTask = async (task: Task) => {
    try {
      const data = await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      toast({ title: 'Tarefa iniciada', description: 'Bom trabalho! Foco total.' });
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel iniciar a tarefa.', variant: 'destructive' });
    }
  };

  const handleAddTask = async () => {
    if (!formTitle.trim()) {
      setFormTitleError('O titulo e obrigatorio');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = { title: formTitle.trim(), priority: formPriority };
      if (formDescription.trim()) body.description = formDescription.trim();
      if (formSubjectId) body.subjectId = formSubjectId;
      if (formDueDate) body.dueDate = formDueDate;
      if (formEstimatedMinutes) body.estimatedMinutes = parseInt(formEstimatedMinutes, 10);

      const data = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setTasks((prev) => [data.task, ...prev]);
      setAddDialogOpen(false);
      resetForm();
      toast({ title: 'Tarefa criada', description: 'Sua tarefa foi adicionada com sucesso.' });
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel criar a tarefa.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async () => {
    if (!taskToEdit || !formTitle.trim()) {
      setFormTitleError('O titulo e obrigatorio');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = { title: formTitle.trim(), priority: formPriority, status: formStatus };
      body.description = formDescription.trim() || null;
      body.subjectId = formSubjectId || null;
      body.dueDate = formDueDate || null;
      body.estimatedMinutes = formEstimatedMinutes ? parseInt(formEstimatedMinutes, 10) : null;

      const data = await apiFetch(`/api/tasks/${taskToEdit.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskToEdit.id ? data.task : t)));
      setEditDialogOpen(false);
      setTaskToEdit(null);
      resetForm();
      toast({ title: 'Tarefa atualizada', description: 'Alteracoes salvas com sucesso.' });
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel atualizar a tarefa.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/tasks/${taskToDelete.id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      if (expandedTaskId === taskToDelete.id) setExpandedTaskId(null);
      toast({ title: 'Tarefa excluida', description: 'A tarefa foi removida.' });
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      toast({ title: 'Erro', description: 'Nao foi possivel excluir a tarefa.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ===== RENDER =====
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--ws-text-primary)' }}>
            Tarefas
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
            Organize seus estudos e conquiste seus objetivos
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setAddDialogOpen(true); }}
          className="flex items-center gap-2 self-start"
          style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)', borderRadius: 'var(--ws-radius-button)' }}
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4"
      >
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-xl p-1"
          style={{ background: 'var(--ws-bg-dark)', borderRadius: 'var(--ws-radius-card)' }}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all"
              style={{ color: activeFilter === tab.key ? 'var(--ws-text-primary)' : 'var(--ws-text-tertiary)' }}
            >
              {activeFilter === tab.key && (
                <motion.div
                  layoutId="activeTaskTab"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'var(--ws-glass)', boxShadow: 'var(--ws-shadow-soft)', border: '1px solid var(--ws-glass-border)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span
                className="relative z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs"
                style={{ background: activeFilter === tab.key ? 'var(--ws-accent)' : 'var(--ws-glass-border)', color: activeFilter === tab.key ? 'white' : 'var(--ws-text-tertiary)' }}
              >
                {taskCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Sort Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <Filter className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>Ordenar:</span>
        {(
          [
            { key: 'dueDate' as SortKey, label: 'Data de entrega' },
            { key: 'priority' as SortKey, label: 'Prioridade' },
            { key: 'createdAt' as SortKey, label: 'Criacao' },
            { key: 'title' as SortKey, label: 'Titulo' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => toggleSort(opt.key)}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              background: sortKey === opt.key ? 'var(--ws-accent)' : 'transparent',
              color: sortKey === opt.key ? 'white' : 'var(--ws-text-tertiary)',
              border: `1px solid ${sortKey === opt.key ? 'var(--ws-accent)' : 'var(--ws-glass-border)'}`,
            }}
          >
            {opt.label}
            {sortKey === opt.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
      </motion.div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--ws-glass-border)', background: 'var(--ws-glass)', borderRadius: 'var(--ws-radius-card)' }}
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16"
          style={{ borderColor: 'var(--ws-glass-border)', background: 'var(--ws-glass)' }}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--ws-bg-dark)' }}>
            <ListTodo className="h-8 w-8" style={{ color: 'var(--ws-text-tertiary)' }} />
          </div>
          <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>
            {activeFilter === 'ALL'
              ? 'Nenhuma tarefa ainda'
              : activeFilter === 'COMPLETED'
                ? 'Nenhuma tarefa concluida'
                : activeFilter === 'PENDING'
                  ? 'Nenhuma tarefa pendente'
                  : 'Nenhuma tarefa em andamento'}
          </h3>
          <p className="mb-6 max-w-sm text-center text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
            {activeFilter === 'ALL'
              ? 'Comece adicionando sua primeira tarefa para organizar seus estudos.'
              : 'Mude o filtro ou adicione novas tarefas.'}
          </p>
          {activeFilter === 'ALL' && (
            <Button
              onClick={() => { resetForm(); setAddDialogOpen(true); }}
              variant="outline"
              className="gap-2"
              style={{ borderRadius: 'var(--ws-radius-button)' }}
            >
              <Plus className="h-4 w-4" />
              Criar primeira tarefa
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isCompleted = task.status === 'COMPLETED';
              const isInProgress = task.status === 'IN_PROGRESS';
              const isPending = task.status === 'PENDING';
              const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
              const overdue = task.dueDate && isOverdue(task.dueDate) && !isCompleted;

              return (
                <motion.div key={task.id} variants={itemVariants} layout className="relative">
                  <XPCelebration show={xpCelebrationTaskId === task.id} taskId={task.id} />
                  <div
                    className="group overflow-hidden border p-4 transition-all"
                    style={{
                      borderColor: isExpanded ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                      background: 'var(--ws-glass)',
                      borderRadius: 'var(--ws-radius-card)',
                      opacity: isCompleted ? 0.7 : 1,
                      boxShadow: isExpanded ? 'var(--ws-shadow-soft)' : 'none',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        disabled={completingTaskId === task.id}
                        className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
                        aria-label={isCompleted ? 'Desmarcar tarefa' : 'Concluir tarefa'}
                      >
                        {completingTaskId === task.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--ws-accent)' }} />
                        ) : isCompleted ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                            <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--ws-verdigris)' }} />
                          </motion.div>
                        ) : (
                          <Circle className="h-5 w-5" style={{ color: 'var(--ws-text-tertiary)' }} />
                        )}
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`text-sm font-semibold leading-tight ${isCompleted ? 'line-through' : ''}`}
                                style={{ color: 'var(--ws-text-primary)' }}
                              >
                                {task.title}
                              </h3>
                              {/* Priority Badge */}
                              <span
                                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${pCfg.color} 10%, transparent)`,
                                  borderColor: `color-mix(in srgb, ${pCfg.color} 20%, transparent)`,
                                  color: pCfg.color,
                                }}
                              >
                                {task.priority === 'URGENT' ? <Zap className="h-3 w-3" /> : <Flag className="h-3 w-3" />}
                                {pCfg.label}
                              </span>
                            </div>
                            {task.description && !isExpanded && (
                              <p className="mt-1 line-clamp-1 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Expand/Collapse */}
                          <button
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className="shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--ws-bg-dark)]"
                            aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                          >
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />
                              : <ChevronDown className="h-4 w-4" style={{ color: 'var(--ws-text-tertiary)' }} />}
                          </button>
                        </div>

                        {/* Meta row */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {/* Subject */}
                          {task.subject && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
                              <span className="inline-block h-2 w-2 rounded-full" style={{ background: task.subject.color }} />
                              {task.subject.name}
                            </span>
                          )}

                          {/* Due date */}
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 text-xs ${overdue ? 'font-medium' : ''}`}
                              style={{ color: overdue ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)' }}
                            >
                              {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                              {formatDueDate(task.dueDate)}
                            </span>
                          )}

                          {/* Estimated time */}
                          {task.estimatedMinutes && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                              <Clock className="h-3 w-3" />
                              {formatMinutes(task.estimatedMinutes)}
                            </span>
                          )}

                          {/* Status badge */}
                          {isInProgress && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: 'color-mix(in srgb, #f59e0b 10%, transparent)',
                                borderColor: 'color-mix(in srgb, #f59e0b 20%, transparent)',
                                color: '#f59e0b',
                              }}
                            >
                              <Play className="h-3 w-3" />
                              Em andamento
                            </span>
                          )}

                          {/* Completed time */}
                          {isCompleted && task.completedAt && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ws-verdigris)' }}>
                              <CheckCircle2 className="h-3 w-3" />
                              {formatDistanceToNow(parseISO(task.completedAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>

                        {/* Expanded Detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--ws-glass-border)' }}>
                                {/* Full description */}
                                {task.description && (
                                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                                    {task.description}
                                  </p>
                                )}

                                {/* Details grid */}
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  <div className="rounded-lg p-2" style={{ background: 'var(--ws-bg-dark)' }}>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>Prioridade</p>
                                    <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                                      {PRIORITY_EMOJI[task.priority]} {pCfg.label}
                                    </p>
                                  </div>
                                  <div className="rounded-lg p-2" style={{ background: 'var(--ws-bg-dark)' }}>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>Entrega</p>
                                    <p className={`mt-0.5 text-xs font-medium ${overdue ? '' : ''}`} style={{ color: overdue ? 'var(--ws-accent)' : 'var(--ws-text-primary)' }}>
                                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                    </p>
                                  </div>
                                  <div className="rounded-lg p-2" style={{ background: 'var(--ws-bg-dark)' }}>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>Tempo</p>
                                    <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                                      {task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : '-'}
                                    </p>
                                  </div>
                                  <div className="rounded-lg p-2" style={{ background: 'var(--ws-bg-dark)' }}>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>Criada</p>
                                    <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--ws-text-primary)' }}>
                                      {formatDistanceToNow(parseISO(task.createdAt), { addSuffix: true, locale: ptBR })}
                                    </p>
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {isPending && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-xs"
                                      onClick={(e) => { e.stopPropagation(); handleStartTask(task); }}
                                      style={{ borderRadius: 'var(--ws-radius-button)' }}
                                    >
                                      <Play className="h-3 w-3" />
                                      Iniciar
                                    </Button>
                                  )}
                                  {!isCompleted && !isPending && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleComplete(task);
                                      }}
                                      style={{ borderRadius: 'var(--ws-radius-button)' }}
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Concluir
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    onClick={(e) => { e.stopPropagation(); openEditDialog(task); }}
                                    style={{ borderRadius: 'var(--ws-radius-button)' }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); setDeleteDialogOpen(true); }}
                                    style={{ borderRadius: 'var(--ws-radius-button)', color: 'var(--ws-accent)' }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Excluir
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Task Dialog */}
      <TaskFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        subjects={subjects}
        title={formTitle}
        setTitle={setFormTitle}
        description={formDescription}
        setDescription={setFormDescription}
        subjectId={formSubjectId}
        setSubjectId={setFormSubjectId}
        priority={formPriority}
        setPriority={setFormPriority}
        dueDate={formDueDate}
        setDueDate={setFormDueDate}
        estimatedMinutes={formEstimatedMinutes}
        setEstimatedMinutes={setFormEstimatedMinutes}
        titleError={formTitleError}
        setTitleError={setFormTitleError}
        submitting={submitting}
        onSubmit={handleAddTask}
        isEdit={false}
      />

      {/* Edit Task Dialog */}
      <TaskFormDialog
        open={editDialogOpen}
        onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setTaskToEdit(null); } }}
        subjects={subjects}
        title={formTitle}
        setTitle={setFormTitle}
        description={formDescription}
        setDescription={setFormDescription}
        subjectId={formSubjectId}
        setSubjectId={setFormSubjectId}
        priority={formPriority}
        setPriority={setFormPriority}
        dueDate={formDueDate}
        setDueDate={setFormDueDate}
        estimatedMinutes={formEstimatedMinutes}
        setEstimatedMinutes={setFormEstimatedMinutes}
        status={formStatus}
        setStatus={setFormStatus}
        titleError={formTitleError}
        setTitleError={setFormTitleError}
        submitting={submitting}
        onSubmit={handleEditTask}
        isEdit
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent style={{ borderRadius: 'var(--ws-radius-card)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--ws-text-primary)' }}>
              Excluir tarefa?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--ws-text-tertiary)' }}>
              Tem certeza que deseja excluir &quot;{taskToDelete?.title}&quot;? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={submitting} style={{ borderRadius: 'var(--ws-radius-button)' }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={submitting}
              className="gap-2"
              style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)', borderRadius: 'var(--ws-radius-button)' }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
