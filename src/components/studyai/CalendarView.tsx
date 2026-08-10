'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  GraduationCap,
  BookOpen,
  FileText,
  Presentation,
  Package,
  Timer,
  RefreshCw,
  Brain,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
interface CalendarViewProps {
  onNavigate: (tab: string, data?: any) => void;
}

interface EventSubject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  type: 'EXAM' | 'HOMEWORK' | 'SEMINAR' | 'DELIVERY' | 'CLASS' | 'REVIEW' | 'STUDY_SESSION' | 'OTHER';
  date: string;
  endDate?: string | null;
  subjectId?: string | null;
  subject?: EventSubject | null;
  isAllDay: boolean;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubjectOption {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ===== CONSTANTS =====
const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  EXAM: {
    label: 'Prova',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    color: '#f43f5e',
  },
  HOMEWORK: {
    label: 'Trabalho',
    icon: <FileText className="h-3.5 w-3.5" />,
    color: '#f59e0b',
  },
  SEMINAR: {
    label: 'Seminário',
    icon: <Presentation className="h-3.5 w-3.5" />,
    color: '#a855f7',
  },
  DELIVERY: {
    label: 'Entrega',
    icon: <Package className="h-3.5 w-3.5" />,
    color: '#f97316',
  },
  CLASS: {
    label: 'Aula',
    icon: <BookOpen className="h-3.5 w-3.5" />,
    color: '#14b8a6',
  },
  REVIEW: {
    label: 'Revisão',
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: '#10b981',
  },
  STUDY_SESSION: {
    label: 'Sessão',
    icon: <Brain className="h-3.5 w-3.5" />,
    color: '#0ea5e9',
  },
  OTHER: {
    label: 'Outro',
    icon: <MoreHorizontal className="h-3.5 w-3.5" />,
    color: '#6b7280',
  },
};

const TYPE_OPTIONS = [
  { value: 'EXAM', label: 'Prova' },
  { value: 'HOMEWORK', label: 'Trabalho' },
  { value: 'SEMINAR', label: 'Seminário' },
  { value: 'DELIVERY', label: 'Entrega' },
  { value: 'CLASS', label: 'Aula' },
  { value: 'REVIEW', label: 'Revisão' },
  { value: 'STUDY_SESSION', label: 'Sessão' },
  { value: 'OTHER', label: 'Outro' },
];

const COLOR_PRESETS = [
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Âmbar', value: '#F59E0B' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Roxo', value: '#A855F7' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Terracota', value: '#C2703E' },
  { name: 'Oliva', value: '#65A30D' },
];

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ===== ANIMATION VARIANTS =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" as const } },
};

// ===== EVENT FORM DIALOG =====
function EventFormDialog({
  open,
  onOpenChange,
  subjects,
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType,
  date,
  setDate,
  endDate,
  setEndDate,
  isAllDay,
  setIsAllDay,
  subjectId,
  setSubjectId,
  color,
  setColor,
  titleError,
  dateError,
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
  date: string;
  setDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  subjectId: string;
  setSubjectId: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  titleError: string;
  dateError: string;
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
            {isEdit ? 'Editar evento' : 'Novo evento'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ws-text-tertiary)' }}>
            {isEdit ? 'Atualize os detalhes do evento.' : 'Adicione um evento ao seu calendário.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="event-title" style={{ color: 'var(--ws-text-secondary)' }}>
              Título <span style={{ color: 'var(--ws-accent)' }}>*</span>
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova de Matemática"
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
            <Label htmlFor="event-desc" style={{ color: 'var(--ws-text-secondary)' }}>
              Descrição (opcional)
            </Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o evento..."
              rows={2}
              style={{ borderRadius: 'var(--ws-radius-button)', borderColor: 'var(--ws-glass-border)' }}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--ws-text-secondary)' }}>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger style={{ borderRadius: 'var(--ws-radius-button)' }}>
                <SelectValue placeholder="Tipo do evento" />
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

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="event-date" style={{ color: 'var(--ws-text-secondary)' }}>
              Data <span style={{ color: 'var(--ws-accent)' }}>*</span>
            </Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                borderRadius: 'var(--ws-radius-button)',
                borderColor: dateError ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
              }}
            />
            {dateError && (
              <p className="text-xs" style={{ color: 'var(--ws-accent)' }}>{dateError}</p>
            )}
          </div>

          {/* Dia inteiro + Hora de término */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="event-allday"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(!!checked)}
              />
              <Label htmlFor="event-allday" className="text-sm cursor-pointer" style={{ color: 'var(--ws-text-secondary)' }}>
                Dia inteiro
              </Label>
            </div>
          </div>

          {!isAllDay && (
            <div className="space-y-2">
              <Label htmlFor="event-enddate" style={{ color: 'var(--ws-text-secondary)' }}>
                Hora de término (opcional)
              </Label>
              <Input
                id="event-enddate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ borderRadius: 'var(--ws-radius-button)', borderColor: 'var(--ws-glass-border)' }}
              />
            </div>
          )}

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

          {/* Cor */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--ws-text-secondary)' }}>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c.value,
                    border: color === c.value ? '2px solid var(--ws-text-primary)' : '2px solid transparent',
                    outline: color === c.value ? '2px solid var(--ws-glass)' : 'none',
                    outlineOffset: '2px',
                  }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>
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
            disabled={submitting || !title.trim() || !date}
            style={{
              background: 'var(--ws-accent)',
              color: 'var(--ws-text-on-dark)',
              borderRadius: 'var(--ws-radius-button)',
              opacity: submitting || !title.trim() || !date ? 0.5 : 1,
            }}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Salvar alterações' : 'Criar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== EVENT CARD IN SIDEBAR =====
function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const typeConfig = TYPE_CONFIG[event.type] || TYPE_CONFIG.OTHER;
  const eventColor = event.color || (event.subject?.color) || 'var(--ws-gold)';
  const isPast = isBefore(parseISO(event.date), startOfDay(new Date()));

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="group relative"
    >
      <div
        className="overflow-hidden border-l-4 p-3 transition-all duration-300"
        style={{
          borderRadius: 'var(--ws-radius-card)',
          borderColor: 'var(--ws-glass-border)',
          borderLeftColor: eventColor,
          background: 'var(--ws-glass)',
          opacity: isPast ? 0.6 : 1,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className="text-sm font-medium truncate"
                style={{ color: 'var(--ws-text-primary)' }}
              >
                {event.title}
              </h4>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, ${typeConfig.color} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${typeConfig.color} 20%, transparent)`,
                  color: typeConfig.color,
                }}
              >
                {typeConfig.icon}
                {typeConfig.label}
              </span>
            </div>

            {/* Subject */}
            {event.subject && (
              <div className="mt-1 flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: event.subject.color || 'var(--ws-gold)' }}
                />
                <span className="text-xs truncate" style={{ color: 'var(--ws-text-tertiary)' }}>
                  {event.subject.name}
                </span>
              </div>
            )}

            {/* Time */}
            <div className="mt-1.5 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" style={{ color: 'var(--ws-text-tertiary)' }} />
                <span className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                  {event.isAllDay
                    ? 'Dia inteiro'
                    : format(parseISO(event.date), 'HH:mm')}
                </span>
              </div>
              {event.endDate && (
                <span className="text-[11px]" style={{ color: 'var(--ws-text-tertiary)' }}>
                  até {format(parseISO(event.endDate), 'HH:mm')}
                </span>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <p className="mt-1.5 text-xs line-clamp-2" style={{ color: 'var(--ws-text-tertiary)' }}>
                {event.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(event)}
              className="rounded-md p-1 transition-colors hover:bg-black/5"
              style={{ color: 'var(--ws-text-tertiary)' }}
              aria-label="Editar evento"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="rounded-md p-1 transition-colors hover:bg-black/5"
              style={{ color: 'var(--ws-accent)' }}
              aria-label="Excluir evento"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== SKELETON LOADER =====
function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ===== EMPTY STATE =====
function EmptyEventsState({ selectedDate }: { selectedDate: Date }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}
      >
        <Calendar className="h-7 w-7" style={{ color: 'var(--ws-accent)' }} />
      </div>
      <h3 className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>
        Sem eventos
      </h3>
      <p className="mt-1 max-w-xs text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
        {`Nenhum evento para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`}
      </p>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export function CalendarView({ onNavigate }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('STUDY_SESSION');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0].value);
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');

  // ===== Compute calendar grid =====
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // ===== Map events to dates for dot display =====
  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((evt) => {
      const dayKey = format(parseISO(evt.date), 'yyyy-MM-dd');
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(evt);
    });
    return map;
  }, [events]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsMap[dayKey] || [];
  }, [selectedDate, eventsMap]);

  // ===== Fetch events and subjects =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const monthStr = format(currentMonth, 'yyyy-MM');
      const [eventsData, subjectsData] = await Promise.all([
        apiFetch(`/api/calendar?month=${monthStr}`),
        apiFetch('/api/subjects'),
      ]);

      setEvents(eventsData.events || []);
      setSubjects(subjectsData.subjects || []);
    } catch (error: any) {
      if (error instanceof ApiError && error.isSessionExpired) return;
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o calendário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== Reset form =====
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('STUDY_SESSION');
    setDate(format(selectedDate, 'yyyy-MM-dd'));
    setEndDate('');
    setIsAllDay(false);
    setSubjectId('');
    setColor(COLOR_PRESETS[0].value);
    setTitleError('');
    setDateError('');
    setEditingEvent(null);
  };

  // ===== Open form dialog for create =====
  const openCreateDialog = () => {
    resetForm();
    setFormOpen(true);
  };

  // ===== Open form dialog for edit =====
  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setType(event.type);
    setDate(format(parseISO(event.date), 'yyyy-MM-dd'));
    setEndDate(event.endDate ? format(parseISO(event.endDate), "yyyy-MM-dd'T'HH:mm") : '');
    setIsAllDay(event.isAllDay);
    setSubjectId(event.subjectId || '');
    setColor(event.color || COLOR_PRESETS[0].value);
    setTitleError('');
    setDateError('');
    setFormOpen(true);
  };

  // ===== Submit form (create or update) =====
  const handleSubmit = async () => {
    let hasError = false;

    if (!title.trim()) {
      setTitleError('Título é obrigatório');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (!date) {
      setDateError('Data é obrigatória');
      hasError = true;
    } else {
      setDateError('');
    }

    if (hasError) return;

    try {
      setSubmitting(true);

      const body: any = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        date: new Date(date).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isAllDay,
        subjectId: subjectId || null,
        color: color || null,
      };

      if (editingEvent) {
        await apiFetch(`/api/calendar/${editingEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast({ title: 'Evento atualizado', description: 'Suas alterações foram salvas.' });
      } else {
        await apiFetch('/api/calendar', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast({ title: 'Evento criado!', description: 'Seu evento foi adicionado ao calendário.' });
      }

      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      if (error instanceof ApiError && error.isSessionExpired) return;
      console.error('Erro ao salvar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o evento.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Delete event =====
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await apiFetch(`/api/calendar/${deleteId}`, { method: 'DELETE' });

      setEvents((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
      toast({ title: 'Evento excluído', description: 'O evento foi removido com sucesso.' });
    } catch (error: any) {
      if (error instanceof ApiError && error.isSessionExpired) return;
      console.error('Erro ao excluir evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o evento.',
        variant: 'destructive',
      });
    }
  };

  // ===== Navigation helpers =====
  const goToPrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // ===== Render day cell =====
  const renderDayCell = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsMap[dayKey] || [];
    const inCurrentMonth = isSameMonth(day, currentMonth);
    const isSelected = isSameDay(day, selectedDate);
    const today = isToday(day);

    // Get unique colors for event dots
    const dotColors = [...new Set(dayEvents.slice(0, 3).map((e) => e.color || e.subject?.color || 'var(--ws-gold)'))];

    return (
      <motion.button
        key={dayKey}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedDate(day)}
        className="relative flex flex-col items-center justify-center gap-0.5 aspect-square rounded-xl transition-all"
        style={{
          background: isSelected
            ? 'var(--ws-accent)'
            : today
            ? 'color-mix(in srgb, var(--ws-accent) 12%, transparent)'
            : 'transparent',
          color: isSelected
            ? 'var(--ws-text-on-dark)'
            : inCurrentMonth
            ? 'var(--ws-text-primary)'
            : 'var(--ws-text-tertiary)',
          opacity: inCurrentMonth ? 1 : 0.3,
        }}
        aria-label={format(day, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      >
        <span className="text-sm font-medium">{format(day, 'd')}</span>
        {dotColors.length > 0 && (
          <div className="flex gap-0.5">
            {dotColors.map((c, i) => (
              <div
                key={i}
                className="h-1 w-1 rounded-full"
                style={{
                  background: isSelected
                    ? 'var(--ws-text-on-dark)'
                    : c,
                }}
              />
            ))}
          </div>
        )}
      </motion.button>
    );
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6" aria-label="Calendário">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
            Calendário
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ws-text-tertiary)' }}>
            Organize seus estudos e compromissos
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
          <span className="hidden sm:inline">Novo evento</span>
        </Button>
      </motion.div>

      {/* Calendar + Sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <CalendarSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden border p-4"
              style={{
                borderRadius: 'var(--ws-radius-card)',
                borderColor: 'var(--ws-glass-border)',
                background: 'var(--ws-glass)',
              }}
            >
              {/* Month Navigation */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--ws-text-primary)' }}>
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                  <button
                    onClick={goToToday}
                    className="rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors"
                    style={{
                      borderColor: 'var(--ws-glass-border)',
                      color: 'var(--ws-text-tertiary)',
                    }}
                  >
                    Hoje
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrevMonth}
                    className="rounded-lg p-2 transition-colors hover:bg-black/5"
                    style={{ color: 'var(--ws-text-secondary)' }}
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="rounded-lg p-2 transition-colors hover:bg-black/5"
                    style={{ color: 'var(--ws-text-secondary)' }}
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS.map((dayLabel) => (
                  <div
                    key={dayLabel}
                    className="flex items-center justify-center py-1"
                  >
                    <span className="text-[10px] font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
                      {dayLabel}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => renderDayCell(day))}
              </div>

              {/* Upcoming events summary */}
              {events.length > 0 && (
                <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--ws-glass-border)' }}>
                  <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--ws-text-tertiary)' }} />
                  <span className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                    {events.length} evento{events.length !== 1 ? 's' : ''} em{' '}
                    {format(currentMonth, 'MMMM', { locale: ptBR })}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar: Events for selected date */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border p-4"
            style={{
              borderRadius: 'var(--ws-radius-card)',
              borderColor: 'var(--ws-glass-border)',
              background: 'var(--ws-glass)',
              maxHeight: '70vh',
            }}
          >
            {/* Selected date header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ws-text-primary)' }}>
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                  {isToday(selectedDate) ? 'Hoje' : format(selectedDate, 'EEEE', { locale: ptBR })}
                </p>
              </div>
              {selectedDateEvents.length > 0 && (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: 'var(--ws-accent)',
                    color: 'var(--ws-text-on-dark)',
                  }}
                >
                  {selectedDateEvents.length}
                </span>
              )}
            </div>

            {/* Event list */}
            <ScrollArea className="max-h-96">
              {selectedDateEvents.length === 0 ? (
                <EmptyEventsState selectedDate={selectedDate} />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  <AnimatePresence mode="popLayout">
                    {selectedDateEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={openEditDialog}
                        onDelete={setDeleteId}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </ScrollArea>

            {/* Quick add button */}
            <Button
              onClick={openCreateDialog}
              variant="outline"
              className="mt-3 w-full flex items-center justify-center gap-2 text-xs"
              style={{
                borderRadius: 'var(--ws-radius-button)',
                borderColor: 'var(--ws-glass-border)',
                color: 'var(--ws-text-secondary)',
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar evento
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Add/Edit Event Dialog */}
      <EventFormDialog
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
        date={date}
        setDate={setDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isAllDay={isAllDay}
        setIsAllDay={setIsAllDay}
        subjectId={subjectId}
        setSubjectId={setSubjectId}
        color={color}
        setColor={setColor}
        titleError={titleError}
        dateError={dateError}
        submitting={submitting}
        onSubmit={handleSubmit}
        isEdit={!!editingEvent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent style={{ borderRadius: 'var(--ws-radius-card)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--ws-text-primary)' }}>
              Excluir evento?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--ws-text-tertiary)' }}>
              Esta ação não pode ser desfeita. O evento será permanentemente removido.
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
    </section>
  );
}

export default CalendarView;
