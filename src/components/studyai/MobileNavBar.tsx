'use client';

import { useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Home, BookOpen, ListTodo, Timer, MoreHorizontal,
  Target, CalendarDays,
  Swords, GraduationCap, Rocket, Dna, Route, Compass, Siren, Trophy,
  Shield, Lock, LogOut, Crown,
  BookText, Layers, ScrollText, MessageCircle, ChevronRight, Settings,
  PenTool, Palette,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Tab } from './DashboardView';
import { canAccess, type Plan } from '@/lib/plan-gating';

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
  { id: 'drawing', label: 'Desenhos', icon: PenTool, group: 'Estudo' },
  { id: 'covers', label: 'Capas', icon: Palette, group: 'Estudo' },
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
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export function MobileNavBar({ activeTab, onTabChange, isAdmin, isPremium, onUpgrade }: MobileNavBarProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const plan = (user?.plan || 'FREE') as Plan;
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

  const handleLogout = () => {
    setLogoutDialogOpen(true);
    setMoreOpen(false);
  };

  const confirmLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleManageSubscription = async () => {
    try {
      const { apiFetch } = await import('@/lib/api');
      const data = await apiFetch('/api/stripe/portal', { method: 'POST' });
      if (data.url) window.location.href = data.url;
    } catch {}
    setMoreOpen(false);
  };

  const planLabel = plan === 'SENSEI' ? '🧠 Sensei' : plan === 'SAMURAI' ? '🥋 Samurai' : isAdmin ? 'Admin' : '🥋 Shojin';
  const planBg = plan !== 'FREE' ? 'bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]' : 'bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)]';

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="no-select fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        role="navigation"
        aria-label="Navegação mobile"
      >
        <div className="flex h-[60px] items-center justify-around px-1">
          {BOTTOM_BAR_IDS.map(id => {
            const item = ALL_ITEMS.find(i => i.id === id);
            if (!item) return null;
            const active = isActive(id);
            const Icon = item.icon;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
                  active
                    ? 'text-[var(--ws-accent)]'
                    : 'text-[var(--ws-text-tertiary)] active:text-[var(--ws-text-secondary)]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -top-1.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--ws-accent)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
              isMoreActive
                ? 'text-[var(--ws-accent)]'
                : 'text-[var(--ws-text-tertiary)] active:text-[var(--ws-text-secondary)]'
            }`}
            aria-label="Mais opções"
          >
            <div className="relative">
              <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.5 : 1.8} />
              {isMoreActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--ws-accent)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            <span className="text-[10px] font-medium leading-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-2xl border-t border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 pb-4 pt-2"
          style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Sheet Handle */}
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--ws-glass-border)]" />

          <SheetHeader className="px-0 pb-3">
            <SheetTitle className="text-base font-semibold text-[var(--ws-text-primary)]">
              Navegação
            </SheetTitle>
          </SheetHeader>

          <div className="max-h-[65vh] overflow-y-auto no-scrollbar">
            {/* User Profile Section */}
            <div className="mb-4 flex items-center gap-3 rounded-ws-card border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ws-glass-border)] bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] font-serif-jp text-sm font-bold text-[var(--ws-accent)]">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--ws-text-primary)]">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">{user?.email || ''}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${planBg} ${plan !== 'FREE' ? 'text-[var(--ws-accent)]' : 'text-[var(--ws-text-secondary)]'}`}>
                {planLabel}
              </span>
            </div>

            {/* Navigation Groups */}
            {['Principal', 'Estudo', 'Explorar', 'Mais'].map(groupName => {
              const groupItems = moreItems.filter(i => i.group === groupName);
              if (groupItems.length === 0) return null;
              return (
                <div key={groupName} className="mb-3">
                  <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-tertiary)]">
                    {groupName}
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {groupItems.map(item => {
                      const active = isActive(item.id);
                      const locked = item.featureGate ? !canAccess(plan, item.featureGate) : false;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => locked ? (onUpgrade?.() || handleSelect(item.id)) : handleSelect(item.id)}
                          className={`relative flex min-h-[56px] flex-col items-center gap-1.5 rounded-ws-card px-2 py-3 transition-colors ${
                            active && !locked
                              ? 'bg-[color-mix(in_srgb,var(--ws-accent)_12%,transparent)] text-[var(--ws-accent)]'
                              : locked
                                ? 'text-[var(--ws-text-tertiary)] opacity-60'
                                : 'text-[var(--ws-text-tertiary)] active:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] active:text-[var(--ws-text-secondary)]'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-medium leading-tight">{item.label}</span>
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
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-tertiary)]">
                  Sistema
                </p>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                  <button
                    onClick={() => handleSelect('admin')}
                    className={`flex flex-col items-center gap-1.5 rounded-ws-card px-2 py-3 transition-colors ${
                      activeTab === 'admin'
                        ? 'bg-[color-mix(in_srgb,var(--ws-accent)_12%,transparent)] text-[var(--ws-accent)]'
                        : 'text-[var(--ws-text-tertiary)] active:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] active:text-[var(--ws-text-secondary)]'
                    }`}
                  >
                    <Shield size={20} />
                    <span className="text-[10px] font-medium leading-tight">Admin</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="mt-2 border-t border-[var(--ws-glass-border)] pt-3">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-tertiary)]">
                Conta
              </p>
              <div className="flex flex-col gap-1">
                {isPremium && (
                  <button
                    onClick={handleManageSubscription}
                    className="flex min-h-[44px] items-center gap-3 rounded-ws-card px-3 py-3 text-sm text-[var(--ws-text-secondary)] transition-colors active:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)]"
                  >
                    <Crown size={18} className="text-[var(--ws-gold)]" />
                    <span>Gerenciar assinatura</span>
                    <ChevronRight size={14} className="ml-auto text-[var(--ws-text-tertiary)]" />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex min-h-[44px] items-center gap-3 rounded-ws-card px-3 py-3 text-sm text-red-500 transition-colors active:bg-red-50 dark:active:bg-red-950/20"
                >
                  <LogOut size={18} />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar seus estudos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
