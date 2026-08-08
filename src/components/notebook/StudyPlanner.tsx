'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, BookOpen, Target } from 'lucide-react';

interface PlannerEvent {
  id: string;
  title: string;
  day: number; // 0=Mon, 6=Sun
  time: number; // 7-22 (hour)
  duration: number; // in hours (0.5, 1, 1.5, 2, etc.)
  color: string;
  type: 'study' | 'class' | 'task' | 'exam';
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const HOURS_START = 7;
const HOURS_END = 22;
const EVENT_COLORS: Record<PlannerEvent['type'], string> = {
  study: 'bg-blue-400/80 dark:bg-blue-600/80 text-white',
  class: 'bg-emerald-400/80 dark:bg-emerald-600/80 text-white',
  task: 'bg-amber-400/80 dark:bg-amber-600/80 text-white',
  exam: 'bg-red-400/80 dark:bg-red-600/80 text-white',
};

const EVENT_LABELS: Record<PlannerEvent['type'], string> = {
  study: 'Estudo',
  class: 'Aula',
  task: 'Tarefa',
  exam: 'Prova',
};

const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3];

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

export default function StudyPlanner() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(0);
  const [modalTime, setModalTime] = useState(8);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDuration, setModalDuration] = useState(1);
  const [modalType, setModalType] = useState<PlannerEvent['type']>('study');
  const [currentTime, setCurrentTime] = useState(new Date());

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOURS_START; i <= HOURS_END; i++) h.push(i);
    return h;
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isCurrentWeek = weekOffset === 0;
  const currentDayIndex = isCurrentWeek ? (() => {
    const dow = today.getDay();
    return dow === 0 ? 6 : dow - 1;
  })() : -1;
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  const getEventsForSlot = useCallback(
    (day: number, hour: number) => {
      return events.filter((e) => {
        if (e.day !== day) return false;
        return hour >= e.time && hour < e.time + e.duration;
      });
    },
    [events]
  );

  const handleSlotClick = (day: number, hour: number) => {
    setModalDay(day);
    setModalTime(hour);
    setModalTitle('');
    setModalDuration(1);
    setModalType('study');
    setModalOpen(true);
  };

  const handleAddEvent = () => {
    if (!modalTitle.trim()) return;
    const newEvent: PlannerEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: modalTitle.trim(),
      day: modalDay,
      time: modalTime,
      duration: modalDuration,
      color: EVENT_COLORS[modalType].split(' ')[0],
      type: modalType,
    };
    setEvents((prev) => [...prev, newEvent]);
    setModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(start)} - ${fmt(end)}`;
  }, [weekDates]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Planejador</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 min-w-[100px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            title="Proxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
            <div className="p-1" />
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`p-1.5 text-center text-xs font-medium
                  ${i === currentDayIndex
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-400'
                  }
                  ${i === currentDayIndex ? 'bg-blue-50 dark:bg-blue-950/40' : ''}
                `}
              >
                <div>{day}</div>
                <div className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500">
                  {weekDates[i].getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {hours.map((hour) => {
            const slotEvents = (dayIdx: number) => getEventsForSlot(dayIdx, hour);
            const isCurrentHourSlot = isCurrentWeek && currentDayIndex >= 0 && currentHour === hour;

            return (
              <div
                key={hour}
                className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-neutral-100 dark:border-neutral-800/60 relative"
              >
                {/* Time Label */}
                <div className="p-1 text-right">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                    {formatHour(hour)}
                  </span>
                </div>

                {/* Day Cells */}
                {DAYS.map((_, dayIdx) => {
                  const cellEvents = slotEvents(dayIdx);
                  const isTodayCol = dayIdx === currentDayIndex;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleSlotClick(dayIdx, hour)}
                      className={`
                        relative border-l border-neutral-100 dark:border-neutral-800/60
                        cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40
                        transition-colors min-h-[32px]
                        ${isTodayCol ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                      `}
                    >
                      {/* Events */}
                      {cellEvents.map((event) => {
                        const isTop = event.time === hour;
                        if (!isTop) return null;
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute left-0.5 right-0.5 z-[5] rounded px-1 py-0.5 text-[10px] leading-tight overflow-hidden ${EVENT_COLORS[event.type]}`}
                            style={{
                              top: 0,
                              height: `${event.duration * 32}px`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate font-medium">{event.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="ml-1 opacity-60 hover:opacity-100 text-[9px] flex-shrink-0"
                                title="Remover"
                              >
                                x
                              </button>
                            </div>
                            <div className="opacity-70">
                              {EVENT_LABELS[event.type]} · {event.duration}h
                            </div>
                          </div>
                        );
                      })}

                      {/* Current Time Indicator */}
                      {isTodayCol && isCurrentHourSlot && (
                        <div
                          className="absolute left-0 right-0 z-[10] h-0.5 bg-red-500"
                          style={{
                            top: `${(currentMinute / 60) * 32}px`,
                          }}
                        >
                          <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-red-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {modalOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Novo Evento
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-lg leading-none"
              >
                x
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                  Titulo
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Ex: Matematica"
                  className="w-full px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEvent();
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    Dia
                  </label>
                  <select
                    value={modalDay}
                    onChange={(e) => setModalDay(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    Horario
                  </label>
                  <select
                    value={modalTime}
                    onChange={(e) => setModalTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                  Duracao
                </label>
                <select
                  value={modalDuration}
                  onChange={(e) => setModalDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d === Math.floor(d) ? `${d}h` : `${d}h`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Tipo
                </label>
                <div className="flex gap-1.5">
                  {(Object.entries(EVENT_LABELS) as [PlannerEvent['type'], string][]).map(
                    ([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setModalType(type)}
                        className={`
                          flex-1 px-2 py-1.5 rounded text-[11px] font-medium transition-colors
                          ${modalType === type
                            ? EVENT_COLORS[type] + ' ring-2 ring-offset-1 ring-neutral-400 dark:ring-neutral-500'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                          }
                        `}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!modalTitle.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Legend */}
      {events.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Target className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Clique em um horario para adicionar um evento
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
