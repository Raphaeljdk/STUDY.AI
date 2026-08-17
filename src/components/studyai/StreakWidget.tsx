'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  updated?: boolean;
  wasIncremented?: boolean;
  wasReset?: boolean;
}

/**
 * StreakWidget — Duolingo-style compact streak display.
 * Fetches streak data and shows current streak with flame animation.
 */
export function StreakWidget() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showPulse, setShowPulse] = useState(false);
  const [showIncrementBadge, setShowIncrementBadge] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    // POST to check/update streak, then fetch fresh data
    apiFetch<StreakData>('/api/streak', { method: 'POST' })
      .then((data) => {
        setStreak(data);
        if (data.wasIncremented) {
          setShowPulse(true);
          setShowIncrementBadge(true);
          setTimeout(() => setShowPulse(false), 800);
          setTimeout(() => setShowIncrementBadge(false), 3000);
        }
      })
      .catch(() => {
        // Silently fail — streak is non-critical
      });
  }, []);

  if (!streak) return null;

  const count = streak.currentStreak;

  return (
    <div className="relative flex items-center gap-2">
      {/* Flame icon with pulse animation on increment */}
      <motion.div
        className="relative"
        animate={showPulse
          ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] }
          : { scale: 1 }
        }
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Flame
          size={22}
          className="text-[#F97316]"
          strokeWidth={1.5}
        />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F97316] px-1 font-sans text-[10px] font-bold text-white"
          >
            {count}
          </motion.span>
        )}
      </motion.div>

      {/* Streak text */}
      <span
        className="text-xs font-medium text-[var(--ws-text-secondary)]"
        style={{ color: count > 0 ? '#F97316' : undefined }}
      >
        {count > 0
          ? `${count} ${count === 1 ? 'dia' : 'dias'} seguidos!`
          : 'Comece sua sequencia!'
        }
      </span>

      {/* Increment badge (shows briefly when streak increases) */}
      <AnimatePresence>
        {showIncrementBadge && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F97316] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
          >
            +1 🔥
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
