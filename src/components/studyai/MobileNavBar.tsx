'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Home, BookOpen, ListTodo, Timer, MoreHorizontal,
  Target, CalendarDays,
  Swords, GraduationCap, Rocket, Dna, Route, Compass, Siren, Trophy,
  Shield, Lock,
  BookText, Layers, ScrollText, MessageCircle,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import type { Tab } from './DashboardView';
import { canAccess, TAB_FEATURE_MAP, type Plan } from '@/lib/plan-gating';

type LucideIcon = typeof Home;

interface NavItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
  group: string;
  featureGate?: string;
}

const ALL_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home, group: 'Principal' },
  { id: 'subjects', label: 'Matérias', icon: BookOpen, group: 'Principal' },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo, group: 'Principal' },
  { id: 'goals', label: 'Metas', icon: Target, group: 'Principal' },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays, group: 'Principal' },
  { id: 'notebooks', label: 'Notebook', icon: BookText, group: 'Estudo' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, group: 'Estudo' },
  { id: 'timer', label: 'Timer', icon: Timer, group: 'Estudo' },
  { id: 'chat', label: 'Sensei AI', icon: MessageCircle, group: 'Estudo' },
  { id: 'battle', label: 'Batalha', icon: Swords, group: 'Explorar', featureGate: 'battle' },
  { id: 'microlesson', label: 'MicroAula', icon: GraduationCap, group: 'Explorar', featureGate: 'microLesson' },
  { id: 'missions', label: 'Missões', icon: Rocket, group: 'Explorar', featureGate: 'missions' },
  { id: 'teach', label: 'Ensinar', icon: ScrollText, group: 'Explorar', featureGate: 'teach' },
  { id: 'brain', label: 'Cérebro', icon: Dna, group: 'Explorar', featureGate: 'brain' },
  { id: 'roadmap', label: 'Roadmap', icon: Route, group: 'Explorar', featureGate: 'roadmapAI' },
  { id: 'discover', label: 'Discover', icon: Compass, group: 'Explorar', featureGate: 'discover' },
  { id: 'emergency', label: 'Emergência', icon: Siren, group: 'Mais' },
  { id: 'progress', label: 'Progresso', icon: Trophy, group: 'Mais', featureGate: 'dashboardFull' },
];

// The 4 items always shown in the bottom bar + More
const BOTTOM_BAR_IDS: Tab[] = ['dashboard', 'subjects', 'tasks', 'timer'];

interface MobileNavBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isAdmin: boolean;
}

export function MobileNavBar({ activeTab, onTabChange, isAdmin }: MobileNavBarProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const plan = (user?.plan || 'FREE') as Plan;
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = useCallback((id: Tab) => {
    if (id === 'notebooks') return activeTab === 'notebooks' || activeTab === 'notebook-edit';
    if (id === 'flashcards') return activeTab === 'flashcards' || activeTab === 'flashcard-review';
    return activeTab === id;
  }, [activeTab]);

  // Items to show in the "More" sheet (everything not in bottom bar)
  const moreItems = ALL_ITEMS.filter(item => !BOTTOM_BAR_IDS.includes(item.id));

  // Check if any "More" item is active
  const isMoreActive = moreItems.some(item => isActive(item.id)) || (isAdmin && activeTab === 'admin');

  const handleSelect = (tab: Tab) => {
    onTabChange(tab);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex h-[60px] items-center justify-around px-2">
          {BOTTOM_BAR_IDS.map(id => {
            const item = ALL_ITEMS.find(i => i.id === id);
            if (!item) return null;
            const active = isActive(id);
            const Icon = item.icon;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`relative flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-ws-button px-2 py-1.5 transition-colors ${
                  active
                    ? 'text-[var(--ws-accent)]'
                    : 'text-[var(--ws-text-tertiary)] active:text-[var(--ws-text-secondary)]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[var(--ws-accent)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`relative flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-ws-button px-2 py-1.5 transition-colors ${
              isMoreActive
                ? 'text-[var(--ws-accent)]'
                : 'text-[var(--ws-text-tertiary)] active:text-[var(--ws-text-secondary)]'
            }`}
            aria-label="Mais opções"
          >
            <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-tight">Mais</span>
            {isMoreActive && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[var(--ws-accent)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] rounded-t-2xl border-t border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 pb-6 pt-2"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          <SheetHeader className="px-0 pb-2">
            <SheetTitle className="text-base font-semibold text-[var(--ws-text-primary)]">
              Navegação
            </SheetTitle>
          </SheetHeader>

          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            {['Principal', 'Estudo', 'Explorar', 'Mais'].map(groupName => {
              const groupItems = moreItems.filter(i => i.group === groupName);
              if (groupItems.length === 0) return null;
              return (
                <div key={groupName} className="mb-3">
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-tertiary)]">
                    {groupName}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {groupItems.map(item => {
                      const active = isActive(item.id);
                      const locked = item.featureGate ? !canAccess(plan, item.featureGate) : false;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`relative flex flex-col items-center gap-1.5 rounded-ws-card px-3 py-3 transition-colors ${
                            active && !locked
                              ? 'bg-[color-mix(in_srgb,var(--ws-accent)_12%,transparent)] text-[var(--ws-accent)]'
                              : locked
                                ? 'text-[var(--ws-text-tertiary)] opacity-60'
                                : 'text-[var(--ws-text-tertiary)] active:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] active:text-[var(--ws-text-secondary)]'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                          {locked && (
                            <Lock size={8} className="absolute right-1.5 top-1.5 text-[var(--ws-gold)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Admin */}
            {isAdmin && (
              <div className="mb-3">
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-tertiary)]">
                  Sistema
                </p>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  <button
                    onClick={() => handleSelect('admin')}
                    className={`flex flex-col items-center gap-1.5 rounded-ws-card px-3 py-3 transition-colors ${
                      activeTab === 'admin'
                        ? 'bg-[color-mix(in_srgb,var(--ws-accent)_12%,transparent)] text-[var(--ws-accent)]'
                        : 'text-[var(--ws-text-tertiary)] active:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] active:text-[var(--ws-text-secondary)]'
                    }`}
                  >
                    <Shield size={20} />
                    <span className="text-[11px] font-medium leading-tight">Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
