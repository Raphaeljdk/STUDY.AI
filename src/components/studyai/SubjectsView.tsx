'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookOpen,
  Code,
  FlaskConical,
  Calculator,
  Globe,
  Music,
  Palette,
  Microscope,
  Scale,
  Landmark,
  GraduationCap,
  Beaker,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Loader2,
  Layers,
  ClipboardList,
  Clock,
  Timer,
  Target,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
interface SubjectsViewProps {
  onNavigate: (tab: string, data?: any) => void;
}

interface Topic {
  id: string;
  name: string;
  description?: string | null;
 mastery: number;
  totalQuestions: number;
  correctAnswers: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
}

interface SubjectList {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    topics: number;
    tasks: number;
  };
}

interface SubjectDetail extends Omit<SubjectList, '_count'> {
  _count: {
    topics: number;
    tasks: number;
    goals: number;
    sessions: number;
  };
  topics: Topic[];
}

interface SubjectWithMastery extends SubjectList {
 mastery: number;
  lastStudied?: string | null;
  pendingTasks: number;
}

// ===== CONSTANTS =====
const COLOR_PRESETS = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#f59e0b' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Pedra', value: '#78716c' },
];

const ICON_OPTIONS: { name: string; value: string; icon: LucideIcon }[] = [
  { name: 'Livro', value: 'book', icon: BookOpen },
  { name: 'Codigo', value: 'code', icon: Code },
  { name: 'Flask', value: 'flask', icon: FlaskConical },
  { name: 'Calculadora', value: 'calculator', icon: Calculator },
  { name: 'Globo', value: 'globe', icon: Globe },
  { name: 'Musica', value: 'music', icon: Music },
  { name: 'Paleta', value: 'palette', icon: Palette },
  { name: 'Microscopio', value: 'microscope', icon: Microscope },
  { name: 'Balanca', value: 'scale', icon: Scale },
  { name: 'Monumento', value: 'landmark', icon: Landmark },
  { name: 'Formatura', value: 'graduation', icon: GraduationCap },
  { name: 'Beker', value: 'beaker', icon: Beaker },
];

const ICON_MAP: Record<string, LucideIcon> = {
  book: BookOpen,
  code: Code,
  flask: FlaskConical,
  calculator: Calculator,
  globe: Globe,
  music: Music,
  palette: Palette,
  microscope: Microscope,
  scale: Scale,
  landmark: Landmark,
  graduation: GraduationCap,
  beaker: Beaker,
};

// ===== ANIMATION VARIANTS =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

const slideInVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

// ===== HELPERS =====
function getSubjectIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || BookOpen;
}

function getMasteryColor(mastery: number): string {
  if (mastery >= 80) return '#22c55e';
  if (mastery >= 60) return '#84cc16';
  if (mastery >= 40) return '#f59e0b';
  if (mastery >= 20) return '#f97316';
  return '#ef4444';
}

function getMasteryLabel(mastery: number): string {
  if (mastery >= 90) return 'Dominio total';
  if (mastery >= 70) return 'Avancado';
  if (mastery >= 50) return 'Intermediario';
  if (mastery >= 25) return 'Iniciante';
  return 'Nao iniciado';
}

function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return '—';
  }
}

// ===== COMPONENTS =====

// Skeleton card for loading state
function SubjectCardSkeleton() {
  return (
    <div className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-5"
      style={{ borderRadius: 'var(--ws-radius-card)' }}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

// Main export
export function SubjectsView({ onNavigate }: SubjectsViewProps) {
  // ===== STATE =====
  const [subjects, setSubjects] = useState<SubjectWithMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTopics, setDetailTopics] = useState<Topic[]>([]);

  // Add/Edit dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#f59e0b');
  const [formIcon, setFormIcon] = useState('book');

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add topic form
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicSubmitting, setTopicSubmitting] = useState(false);

  // ===== FETCH SUBJECTS =====
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Erro ao carregar materias');
      const data = await res.json();

      // Enrich subjects with mastery and pending task data
      const enriched: SubjectWithMastery[] = await Promise.all(
        (data.subjects || []).map(async (s: SubjectList) => {
          try {
            const detailRes = await fetch(`/api/subjects/${s.id}`);
            if (!detailRes.ok) {
              return {
                ...s,
                mastery: 0,
                lastStudied: null,
                pendingTasks: 0,
              };
            }
            const detailData = await detailRes.json();
            const detail: SubjectDetail = detailData.subject;
            const topics = detail.topics || [];
            const avgMastery =
              topics.length > 0
                ? Math.round(topics.reduce((sum: number, t: Topic) => sum + t.mastery, 0) / topics.length)
                : 0;

            // Get pending tasks count - we need to fetch tasks separately
            let pendingTasks = 0;
            let lastStudied: string | null = null;

            // Use sessions count as a proxy - if sessions exist, it was studied
            if (detail._count?.sessions > 0) {
              lastStudied = detail.updatedAt || detail.createdAt;
            }

            return {
              ...s,
              mastery: avgMastery,
              lastStudied,
              pendingTasks,
            };
          } catch {
            return {
              ...s,
              mastery: 0,
              lastStudied: null,
              pendingTasks: 0,
            };
          }
        })
      );

      setSubjects(enriched);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar',
        description: err.message || 'Nao foi possivel carregar suas materias.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ===== FETCH SUBJECT DETAIL =====
  const fetchSubjectDetail = useCallback(async (subjectId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/subjects/${subjectId}`);
      if (!res.ok) throw new Error('Materia nao encontrada');
      const data = await res.json();
      setSubjectDetail(data.subject);
      setDetailTopics(data.subject.topics || []);
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Nao foi possivel carregar os detalhes.',
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSubjectDetail(selectedSubjectId);
      setShowAddTopic(false);
      setTopicName('');
      setTopicDescription('');
    } else {
      setSubjectDetail(null);
      setDetailTopics([]);
    }
  }, [selectedSubjectId, fetchSubjectDetail]);

  // ===== HANDLERS =====

  // Open add dialog
  const openAddDialog = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('#f59e0b');
    setFormIcon('book');
    setShowAddDialog(true);
  };

  // Open edit dialog
  const openEditDialog = () => {
    if (!subjectDetail) return;
    setFormName(subjectDetail.name);
    setFormDescription(subjectDetail.description || '');
    setFormColor(subjectDetail.color);
    setFormIcon(subjectDetail.icon);
    setShowEditDialog(true);
  };

  // Submit add
  const handleAddSubject = async () => {
    if (!formName.trim()) {
      toast({ title: 'Campo obrigatorio', description: 'Informe o nome da materia.', variant: 'destructive' });
      return;
    }
    try {
      setFormSubmitting(true);
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          color: formColor,
          icon: formIcon,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar materia');
      }
      toast({ title: 'Materia criada!', description: `${formName.trim()} foi adicionada com sucesso.` });
      setShowAddDialog(false);
      fetchSubjects();
    } catch (err: any) {
      toast({ title: 'Erro ao criar', description: err.message, variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit edit
  const handleEditSubject = async () => {
    if (!subjectDetail || !formName.trim()) {
      toast({ title: 'Campo obrigatorio', description: 'Informe o nome da materia.', variant: 'destructive' });
      return;
    }
    try {
      setFormSubmitting(true);
      const res = await fetch(`/api/subjects/${subjectDetail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          color: formColor,
          icon: formIcon,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar materia');
      }
      toast({ title: 'Materia atualizada!', description: `${formName.trim()} foi salva com sucesso.` });
      setShowEditDialog(false);
      fetchSubjectDetail(subjectDetail.id);
      fetchSubjects();
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/subjects/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir materia');
      }
      toast({ title: 'Materia excluida', description: 'A materia foi removida com sucesso.' });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      if (selectedSubjectId === deleteTarget) {
        setSelectedSubjectId(null);
      }
      fetchSubjects();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // Add topic
  const handleAddTopic = async () => {
    if (!selectedSubjectId || !topicName.trim()) {
      toast({ title: 'Campo obrigatorio', description: 'Informe o nome do topico.', variant: 'destructive' });
      return;
    }
    try {
      setTopicSubmitting(true);
      const res = await fetch(`/api/subjects/${selectedSubjectId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: topicName.trim(),
          description: topicDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar topico');
      }
      toast({ title: 'Topico adicionado!', description: `${topicName.trim()} foi criado com sucesso.` });
      setTopicName('');
      setTopicDescription('');
      setShowAddTopic(false);
      fetchSubjectDetail(selectedSubjectId);
      fetchSubjects();
    } catch (err: any) {
      toast({ title: 'Erro ao criar topico', description: err.message, variant: 'destructive' });
    } finally {
      setTopicSubmitting(false);
    }
  };

  // ===== RENDER: SUBJECT FORM DIALOG =====
  const renderFormDialog = (
    open: boolean,
    onOpenChange: (v: boolean) => void,
    title: string,
    description: string,
    onSubmit: () => void,
    submitting: boolean,
  ) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl"
        style={{ borderRadius: 'var(--ws-radius-card)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--ws-text-primary)]">{title}</DialogTitle>
          <DialogDescription className="text-[var(--ws-text-tertiary)]">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="subject-name" className="text-[var(--ws-text-secondary)]">Nome da materia *</Label>
            <Input
              id="subject-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Matematica, Portugues, Fisica..."
              className="border-[var(--ws-glass-border)] bg-[var(--ws-bg)] text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)]"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="subject-desc" className="text-[var(--ws-text-secondary)]">Descricao</Label>
            <Textarea
              id="subject-desc"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Opcional: uma breve descricao da materia..."
              rows={2}
              className="border-[var(--ws-glass-border)] bg-[var(--ws-bg)] text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] resize-none"
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label className="text-[var(--ws-text-secondary)]">Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormColor(c.value)}
                  className="relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--ws-bg)]"
                  style={{
                    backgroundColor: c.value,
                    focusRingColor: c.value,
                    boxShadow: formColor === c.value ? `0 0 0 3px var(--ws-bg), 0 0 0 5px ${c.value}` : 'none',
                  }}
                  title={c.name}
                  aria-label={`Cor ${c.name}`}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label className="text-[var(--ws-text-secondary)]">Icone</Label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-4">
              {ICON_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = formIcon === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormIcon(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2.5 transition-all duration-200 hover:scale-105 focus:outline-none ${
                      isSelected
                        ? 'border-[var(--ws-accent)] bg-[var(--ws-accent)]/10'
                        : 'border-[var(--ws-glass-border)] bg-transparent hover:bg-[var(--ws-glass)]'
                    }`}
                    title={opt.name}
                    aria-label={`Icone ${opt.name}`}
                  >
                    <Icon
                      size={20}
                      className={isSelected ? 'text-[var(--ws-accent)]' : 'text-[var(--ws-text-tertiary)]'}
                    />
                    <span className="text-[10px] text-[var(--ws-text-tertiary)]">{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !formName.trim()}
            className="bg-[var(--ws-accent)] text-white hover:bg-[var(--ws-accent)]/90"
          >
            {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
            {title.includes('Nova') ? 'Criar materia' : 'Salvar alteracoes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ===== RENDER: DELETE DIALOG =====
  const renderDeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl"
        style={{ borderRadius: 'var(--ws-radius-card)' }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[var(--ws-text-primary)]">Excluir materia?</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--ws-text-tertiary)]">
            Esta acao nao pode ser desfeita. Todos os topicos, tarefas e sessoes associados a esta materia serao permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleting}
            className="border-[var(--ws-glass-border)] text-[var(--ws-text-secondary)] hover:bg-[var(--ws-glass)]"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {deleting && <Loader2 size={14} className="mr-2 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ===== RENDER: SUBJECT CARD (LIST VIEW) =====
  const renderSubjectCard = (subject: SubjectWithMastery, index: number) => {
    const Icon = getSubjectIcon(subject.icon);
    const masteryColor = getMasteryColor(subject.mastery);
    const masteryLabel = getMasteryLabel(subject.mastery);

    return (
      <motion.div
        key={subject.id}
        variants={itemVariants}
        whileHover={{
          y: -4,
          boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        }}
        whileTap={{ scale: 0.985 }}
        onClick={() => setSelectedSubjectId(subject.id)}
        className="group cursor-pointer border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl transition-colors hover:border-[var(--ws-accent)]/30"
        style={{ borderRadius: 'var(--ws-radius-card)' }}
        role="button"
        tabIndex={0}
        aria-label={`Abrir materia ${subject.name}`}
        onKeyDown={(e) => e.key === 'Enter' && setSelectedSubjectId(subject.id)}
      >
        {/* Color bar at top */}
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${subject.color}, ${subject.color}88)`,
            borderRadius: 'var(--ws-radius-card) var(--ws-radius-card) 0 0',
          }}
        />

        <div className="p-5">
          {/* Header: icon + name */}
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${subject.color}18` }}
            >
              <Icon size={20} style={{ color: subject.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-[var(--ws-text-primary)]">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="mt-0.5 truncate text-xs text-[var(--ws-text-tertiary)]">
                  {subject.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--ws-text-tertiary)]">
              <Layers size={13} className="shrink-0" />
              <span>{subject._count.topics} {subject._count.topics === 1 ? 'topico' : 'topicos'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--ws-text-tertiary)]">
              <ClipboardList size={13} className="shrink-0" />
              <span>{subject._count.tasks} {subject._count.tasks === 1 ? 'tarefa' : 'tarefas'}</span>
            </div>
          </div>

          {/* Mastery bar */}
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--ws-text-tertiary)]">Dominio</span>
              <span className="text-xs font-semibold" style={{ color: masteryColor }}>
                {subject._count.topics === 0 ? '—' : `${subject.mastery}%`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ws-glass-border)]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: masteryColor }}
                initial={{ width: 0 }}
                animate={{ width: subject._count.topics === 0 ? '0%' : `${subject.mastery}%` }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            {subject._count.topics > 0 && (
              <p className="mt-1 text-[10px] text-[var(--ws-text-tertiary)]">{masteryLabel}</p>
            )}
          </div>

          {/* Last studied */}
          {subject.lastStudied && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--ws-text-tertiary)]">
              <Clock size={11} />
              <span>Estudado {formatRelativeDate(subject.lastStudied)}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ===== RENDER: SUBJECT DETAIL VIEW =====
  const renderDetailView = () => {
    if (detailLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    if (!subjectDetail) return null;

    const Icon = getSubjectIcon(subjectDetail.icon);
    const totalMastery =
      detailTopics.length > 0
        ? Math.round(detailTopics.reduce((s, t) => s + t.mastery, 0) / detailTopics.length)
        : 0;

    return (
      <motion.div
        key="detail"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={slideInVariants}
        className="space-y-6"
      >
        {/* Back button + Header */}
        <div>
          <button
            onClick={() => setSelectedSubjectId(null)}
            className="mb-4 flex items-center gap-1.5 text-sm text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-accent)]"
          >
            <ArrowLeft size={16} />
            <span>Voltar as materias</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${subjectDetail.color}18` }}
              >
                <Icon size={24} style={{ color: subjectDetail.color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--ws-text-primary)]">{subjectDetail.name}</h2>
                {subjectDetail.description && (
                  <p className="mt-0.5 text-sm text-[var(--ws-text-tertiary)]">{subjectDetail.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={openEditDialog}
                className="h-9 w-9 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-accent)] hover:bg-[var(--ws-accent)]/10"
                aria-label="Editar materia"
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDeleteTarget(subjectDetail.id);
                  setShowDeleteDialog(true);
                }}
                className="h-9 w-9 text-[var(--ws-text-tertiary)] hover:text-red-500 hover:bg-red-500/10"
                aria-label="Excluir materia"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats cards row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <div className="flex items-center gap-2 text-xs text-[var(--ws-text-tertiary)]">
              <Layers size={14} />
              <span>Topicos</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-[var(--ws-text-primary)]">{subjectDetail._count.topics}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <div className="flex items-center gap-2 text-xs text-[var(--ws-text-tertiary)]">
              <Target size={14} />
              <span>Dominio medio</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold" style={{ color: getMasteryColor(totalMastery) }}>
              {detailTopics.length === 0 ? '—' : `${totalMastery}%`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <div className="flex items-center gap-2 text-xs text-[var(--ws-text-tertiary)]">
              <Timer size={14} />
              <span>Sessoes</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-[var(--ws-text-primary)]">{subjectDetail._count.sessions}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl p-4"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <div className="flex items-center gap-2 text-xs text-[var(--ws-text-tertiary)]">
              <ClipboardList size={14} />
              <span>Tarefas</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-[var(--ws-text-primary)]">{subjectDetail._count.tasks}</p>
          </motion.div>
        </div>

        {/* Topics section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ws-text-primary)]">Topicos</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddTopic(!showAddTopic)}
              className="h-7 gap-1.5 text-xs text-[var(--ws-accent)] hover:bg-[var(--ws-accent)]/10 hover:text-[var(--ws-accent)]"
            >
              {showAddTopic ? <X size={14} /> : <Plus size={14} />}
              {showAddTopic ? 'Cancelar' : 'Adicionar topico'}
            </Button>
          </div>

          {/* Add topic form */}
          <AnimatePresence>
            {showAddTopic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 rounded-lg border border-dashed border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4"
                  style={{ borderRadius: 'var(--ws-radius-card)' }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="topic-name" className="text-xs text-[var(--ws-text-secondary)]">Nome do topico *</Label>
                    <Input
                      id="topic-name"
                      value={topicName}
                      onChange={(e) => setTopicName(e.target.value)}
                      placeholder="Ex: Equacoes do 2o grau"
                      className="h-9 border-[var(--ws-glass-border)] bg-[var(--ws-bg)] text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)]"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="topic-desc" className="text-xs text-[var(--ws-text-secondary)]">Descricao (opcional)</Label>
                    <Input
                      id="topic-desc"
                      value={topicDescription}
                      onChange={(e) => setTopicDescription(e.target.value)}
                      placeholder="Breve descricao do topico..."
                      className="h-9 border-[var(--ws-glass-border)] bg-[var(--ws-bg)] text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)]"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddTopic}
                      disabled={topicSubmitting || !topicName.trim()}
                      className="h-8 gap-1.5 bg-[var(--ws-accent)] text-xs text-white hover:bg-[var(--ws-accent)]/90"
                    >
                      {topicSubmitting && <Loader2 size={12} className="animate-spin" />}
                      <Check size={12} />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Topics list */}
          {detailTopics.length === 0 && !showAddTopic ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--ws-glass-border)] py-10 text-center"
              style={{ borderRadius: 'var(--ws-radius-card)' }}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ws-accent)]/10">
                <Layers size={22} className="text-[var(--ws-accent)]" />
              </div>
              <p className="text-sm font-medium text-[var(--ws-text-primary)]">Nenhum topico ainda</p>
              <p className="mt-1 max-w-[240px] text-xs text-[var(--ws-text-tertiary)]">
                Comece adicionando topicos para organizar seus estudos e acompanhar seu dominio.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddTopic(true)}
                className="mt-3 gap-1.5 text-xs text-[var(--ws-accent)] hover:bg-[var(--ws-accent)]/10"
              >
                <Plus size={14} />
                Adicionar primeiro topico
              </Button>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {detailTopics.map((topic, idx) => {
                  const mc = getMasteryColor(topic.mastery);
                  return (
                    <motion.div
                      key={topic.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="group border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-3.5 transition-colors hover:bg-[var(--ws-glass)]/80"
                      style={{ borderRadius: 'var(--ws-radius-card)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--ws-text-primary)]">{topic.name}</p>
                          {topic.description && (
                            <p className="mt-0.5 truncate text-xs text-[var(--ws-text-tertiary)]">{topic.description}</p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${mc}18`,
                            color: mc,
                            borderColor: `${mc}30`,
                          }}
                        >
                          {topic.mastery}%
                        </Badge>
                      </div>
                      <div className="mt-2.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ws-glass-border)]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: mc }}
                            initial={{ width: 0 }}
                            animate={{ width: `${topic.mastery}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.06, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      {topic.totalQuestions > 0 && (
                        <p className="mt-1.5 text-[10px] text-[var(--ws-text-tertiary)]">
                          {topic.correctAnswers}/{topic.totalQuestions} questoes corretas
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Related tasks summary */}
        {subjectDetail._count.tasks > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--ws-text-primary)]">Tarefas relacionadas</h3>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4"
              style={{ borderRadius: 'var(--ws-radius-card)' }}
            >
              <ClipboardList size={20} className="text-[var(--ws-text-tertiary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--ws-text-primary)]">
                  {subjectDetail._count.tasks} {subjectDetail._count.tasks === 1 ? 'tarefa vinculada' : 'tarefas vinculadas'}
                </p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">
                  Gerencie suas tarefas na aba de tarefas
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('tasks')}
                className="ml-auto shrink-0 text-xs text-[var(--ws-accent)] hover:bg-[var(--ws-accent)]/10"
              >
                Ver tarefas
              </Button>
            </div>
          </div>
        )}

        {/* Study sessions summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--ws-text-primary)]">Sessoes de estudo</h3>
          <div className="flex items-center gap-3 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4"
            style={{ borderRadius: 'var(--ws-radius-card)' }}
          >
            <Timer size={20} className="text-[var(--ws-text-tertiary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--ws-text-primary)]">
                {subjectDetail._count.sessions} {subjectDetail._count.sessions === 1 ? 'sessao registrada' : 'sessoes registradas'}
              </p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">
                Cada sessao contribui para seu XP e sequencia de estudos
              </p>
            </div>
            {subjectDetail._count.sessions > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('sessions')}
                className="ml-auto shrink-0 text-xs text-[var(--ws-accent)] hover:bg-[var(--ws-accent)]/10"
              >
                Ver sessoes
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // ===== RENDER: LIST VIEW =====
  const renderListView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SubjectCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (subjects.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ws-glass-border)] py-16 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ws-accent)]/10">
            <BookOpen size={28} className="text-[var(--ws-accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--ws-text-primary)]">
            Nenhuma materia cadastrada
          </h3>
          <p className="mt-2 max-w-[320px] text-sm text-[var(--ws-text-tertiary)]">
            Comece sua jornada de estudos organizada! Adicione suas materias para acompanhar seu progresso e dominio em cada uma delas.
          </p>
          <Button
            onClick={openAddDialog}
            className="mt-5 gap-2 bg-[var(--ws-accent)] text-white hover:bg-[var(--ws-accent)]/90"
          >
            <Plus size={16} />
            Adicionar primeira materia
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {subjects.map((subject, idx) => renderSubjectCard(subject, idx))}
      </motion.div>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <section className="mx-auto w-full max-w-4xl" aria-label="Gerenciamento de materias">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--ws-text-primary)]">Minhas Materias</h2>
          <p className="mt-0.5 text-sm text-[var(--ws-text-tertiary)]">
            {selectedSubjectId ? 'Detalhes da materia' : 'Organize e acompanhe seus estudos por disciplina'}
          </p>
        </div>
        {!selectedSubjectId && (
          <Button
            onClick={openAddDialog}
            className="gap-2 bg-[var(--ws-accent)] text-white hover:bg-[var(--ws-accent)]/90"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nova materia</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedSubjectId ? renderDetailView() : renderListView()}
      </AnimatePresence>

      {/* Dialogs */}
      {renderFormDialog(
        showAddDialog,
        setShowAddDialog,
        'Nova materia',
        'Adicione uma disciplina para organizar seus estudos e acompanhar seu progresso.',
        handleAddSubject,
        formSubmitting,
      )}
      {renderFormDialog(
        showEditDialog,
        setShowEditDialog,
        'Editar materia',
        'Altere as informacoes da materia.',
        handleEditSubject,
        formSubmitting,
      )}
      {renderDeleteDialog()}
    </section>
  );
}
