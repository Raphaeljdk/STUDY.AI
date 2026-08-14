import { useState, useCallback, useRef, useSyncExternalStore } from 'react';

type UsageType = 'chatMessages' | 'flashcards';

interface UsageState {
  plan: string;
  isPremium: boolean;
  limits: Record<UsageType, number>;
  usage: Record<UsageType, number>;
  remaining: Record<UsageType, number>;
  loading: boolean;
}

const initialState: UsageState = {
  plan: 'FREE',
  isPremium: false,
  limits: { chatMessages: 20, flashcards: 10 },
  usage: { chatMessages: 0, flashcards: 0 },
  remaining: { chatMessages: 20, flashcards: 10 },
  loading: true,
};

// Simple store for usage data (avoids set-state-in-effect lint issue)
let globalUsage: UsageState = { ...initialState };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): UsageState {
  return globalUsage;
}

function getServerSnapshot(): UsageState {
  return initialState;
}

function setUsage(partial: Partial<UsageState>) {
  globalUsage = { ...globalUsage, ...partial };
  listeners.forEach(l => l());
}

export function useUsage() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const fetchedRef = useRef<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage({
          plan: data.plan,
          isPremium: data.isPremium,
          limits: data.limits,
          usage: data.usage,
          remaining: data.remaining,
          loading: false,
        });
      } else {
        setUsage({ loading: false });
      }
    } catch {
      setUsage({ loading: false });
    }
  }, []);

  // Fetch on first render
  if (fetchedRef.current == null) {
    fetchedRef.current = true;
    load();
  }

  const refetch = load;

  const hitLimit = useCallback((type: UsageType): boolean => {
    if (state.isPremium) return false;
    return state.remaining[type] <= 0;
  }, [state.isPremium, state.remaining]);

  return { ...state, refetch, hitLimit };
}
