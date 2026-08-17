'use client';

import { useEffect, useRef } from 'react';
import { parseISO, isTomorrow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface ReminderEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  color?: string | null;
  isAllDay?: number;
  endDate?: string | null;
  subject?: { id: string; name: string; color: string } | null;
}

const STORAGE_KEY = 'studyai_shown_reminders';

/**
 * ReminderCheck — Fetches upcoming calendar events and shows toast
 * notifications for events happening tomorrow.
 * Only shows each reminder once per session (tracked via localStorage).
 */
export function ReminderCheck() {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    apiFetch<{ events: ReminderEvent[] }>('/api/calendar/reminders')
      .then((data) => {
        if (!data?.events?.length) return;

        // Get already-shown reminder IDs from localStorage
        const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        let shownMap: Record<string, string> = {};
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) shownMap = JSON.parse(stored);
        } catch { /* ignore */ }

        // Clean up old entries (different day)
        if (shownMap['_date'] !== now) {
          shownMap = { _date: now };
        }

        const newReminders: ReminderEvent[] = [];

        for (const event of data.events) {
          if (shownMap[event.id]) continue; // Already shown this session

          try {
            const eventDate = parseISO(event.date);
            if (isTomorrow(eventDate)) {
              newReminders.push(event);
              shownMap[event.id] = '1';
            }
          } catch {
            // Skip malformed dates
          }
        }

        // Save updated map
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(shownMap));
        } catch { /* ignore */ }

        // Show toasts (staggered)
        newReminders.forEach((event, idx) => {
          setTimeout(() => {
            const timeStr = event.isAllDay
              ? 'o dia todo'
              : format(parseISO(event.date), 'HH:mm', { locale: ptBR });

            toast({
              title: `Lembrete: ${event.title} amanha!`,
              description: `${event.type ? getEventLabel(event.type) + ' · ' : ''}${timeStr}`,
            });
          }, idx * 600); // Stagger by 600ms
        });
      })
      .catch(() => {
        // Silently fail — reminders are non-critical
      });
  }, []);

  // This component renders nothing visible
  return null;
}

function getEventLabel(type: string): string {
  switch (type?.toUpperCase()) {
    case 'EXAM': return 'Prova';
    case 'DELIVERY': return 'Entrega';
    case 'HOMEWORK': return 'Tarefa';
    case 'SEMINAR': return 'Seminario';
    case 'CLASS': return 'Aula';
    case 'REVIEW': return 'Revisao';
    case 'STUDY_SESSION': return 'Sessao de estudo';
    default: return 'Evento';
  }
}
