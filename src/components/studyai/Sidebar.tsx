'use client';

import { useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, ListTodo, Target, CalendarDays,
  Timer, MessageCircle,
  Swords, GraduationCap, Rocket, Dna, Route, Compass, Siren, Trophy,
  ChevronLeft, ChevronRight, LogOut, Crown, Shield, ChevronDown,
  BookText, Layers, ScrollText, Lock,
  Palette,
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { UsageBar } from './PremiumUpgrade';
import { PWAInstallButton } from '@/components/PWAInstallPrompt';
import type { Tab } from './DashboardView';
import { canAccess, type Plan } from '@/lib/plan-gating';
import { toast } from '@/hooks/use-toast';

type LucideIcon = typeof Home;

interface NavItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
  /** If set, this feature key is checked against the user's plan */
  featureGate?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'subjects', label: 'Matérias', icon: BookOpen },
      { id: 'tasks', label: 'Tarefas', icon: ListTodo },
      { id: 'goals', label: 'Metas', icon: Target },
      { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    ],
  },
  {
    title: 'Estudo',
    defaultOpen: true,
    items: [
      { id: 'notebooks', label: 'Notebook', icon: BookText },
      { id: 'flashcards', label: 'Flashcards', icon: Layers },
      { id: 'timer', label: 'Timer', icon: Timer },
      { id: 'chat', label: 'Sensei AI', icon: MessageCircle },
      { id: 'covers', label: 'Capas', icon: Palette },
    ],
  },
  {
    title: 'Explorar',
    defaultOpen: true,
    items: [
      { id: 'battle', label: 'Batalha', icon: Swords, featureGate: 'battle' },
      { id: 'microlesson', label: 'MicroAula', icon: GraduationCap, featureGate: 'microLesson' },
      { id: 'missions', label: 'Missões', icon: Rocket, featureGate: 'missions' },
      { id: 'teach', label: 'Ensinar', icon: ScrollText, featureGate: 'teach' },
      { id: 'brain', label: 'Cérebro', icon: Dna, featureGate: 'brain' },
      { id: 'roadmap', label: 'Roadmap', icon: Route, featureGate: 'roadmapAI' },
      { id: 'discover', label: 'Discover', icon: Compass, featureGate: 'discover' },
    ],
  },
  {
    title: 'Mais',
    defaultOpen: false,
    items: [
      { id: 'emergency', label: 'Emergência', icon: Siren },
      { id: 'progress', label: 'Progresso', icon: Trophy, featureGate: 'dashboardFull' },
    ],
  },
];

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isAdmin: boolean;
  usage: {
    isPremium: boolean;
    loading: boolean;
    limits: { chatMessages: number; flashcards: number };
    usage: { chatMessages: number; flashcards: number };
  };
  onUpgrade: () => void;
  activeUsers: number;
}

export function Sidebar({ activeTab, onTabChange, isAdmin, usage, onUpgrade, activeUsers }: SidebarProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [collapsed, setCollapsed] = useState(false);
  // Admin users get SENSEI access (mirrors server-side getUserPlan logic)
  const plan = (user?.role === 'ADMIN' ? 'SENSEI' : (user?.plan || 'FREE')) as Plan;

  const isActive = useCallback((id: Tab) => {
    if (id === 'notebooks') return activeTab === 'notebooks' || activeTab === 'notebook-edit';
    if (id === 'flashcards') return activeTab === 'flashcards' || activeTab === 'flashcard-review';
    return activeTab === id;
  }, [activeTab]);

  return (
    <motion.aside
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl lg:flex"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'width' }}
    >
      {/* Logo + Brand */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--ws-glass-border)] px-4 py-3">
        <img src="/studyai-logo.png" alt="StudyAI" width={32} height={32} className="shrink-0 rounded-full object-cover" />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              className="font-serif-jp text-base font-bold tracking-tight text-[var(--ws-text-primary)]"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              StudyAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* User Info */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--ws-glass-border)] px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ws-glass-border)] bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] font-serif-jp text-xs font-bold text-[var(--ws-accent)]">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              className="min-w-0 flex-1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="truncate text-sm font-medium text-[var(--ws-text-primary)]">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-[var(--ws-accent)]">
                {plan === 'SENSEI' ? '🧠 Sensei' : plan === 'SAMURAI' ? '🥋 Samurai' : isAdmin ? 'Admin · Ilimitado' : '🥋 Shojin'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 no-scrollbar" role="navigation" aria-label="Main navigation">
        <div className="flex flex-col gap-1">
          {NAV_GROUPS.map((group) => {
            const hasActive = group.items.some(item => isActive(item.id));
            return (
              <NavGroupSection
                key={group.title}
                group={group}
                collapsed={collapsed}
                isActive={isActive}
                onTabChange={onTabChange}
                hasActive={hasActive}
                plan={plan}
                onUpgrade={onUpgrade}
              />
            );
          })}

          {/* Admin */}
          {isAdmin && (
            <SidebarItem
              id="admin"
              label="Admin"
              icon={Shield}
              active={activeTab === 'admin'}
              collapsed={collapsed}
              onClick={() => onTabChange('admin')}
            />
          )}
        </div>
      </nav>

      {/* Usage bars / manage subscription */}
      {!collapsed && (
        <motion.div
          className="shrink-0 border-t border-[var(--ws-glass-border)] px-3 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {usage.isPremium ? (
            <button
              onClick={async () => {
                try {
                  const data = await (await import('@/lib/api')).apiFetch('/api/stripe/portal', { method: 'POST' });
                  if (data.url) window.location.href = data.url;
                } catch (err: any) {
                  toast({
                    title: 'Erro ao abrir portal',
                    description: err?.message || 'Nao foi possivel abrir o portal de assinatura.',
                    variant: 'destructive',
                  });
                }
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-ws-button bg-[color-mix(in_srgb,var(--ws-accent)_8%,transparent)] px-3 py-2 text-xs font-medium text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_15%,transparent)]"
            >
              <Crown size={12} />
              <span>Gerenciar assinatura</span>
            </button>
          ) : !usage.loading ? (
            <div className="flex flex-col gap-2">
              <UsageBar type="chatMessages" used={usage.usage.chatMessages} limit={usage.limits.chatMessages} />
              <UsageBar type="flashcards" used={usage.usage.flashcards} limit={usage.limits.flashcards} />
              <button
                onClick={onUpgrade}
                className="flex w-full items-center justify-center gap-1.5 rounded-ws-button bg-[color-mix(in_srgb,var(--ws-accent)_8%,transparent)] px-3 py-2 text-xs font-medium text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_15%,transparent)]"
              >
                <Crown size={12} />
                <span>Ver planos</span>
              </button>
            </div>
          ) : null}
        </motion.div>
      )}

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--ws-glass-border)] px-2 py-2.5">
        {/* PWA Install Button */}
        <div className="mb-2">
          <PWAInstallButton collapsed={collapsed} />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex min-h-[36px] flex-1 items-center justify-center gap-2 rounded-ws-button px-3 py-2 text-xs text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-text-secondary)]"
            aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Recolher</span></>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            data-ws-tooltip="Sair"
            className="flex min-h-[36px] items-center justify-center rounded-ws-button px-2.5 py-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

/* ---------- Nav Group Section ---------- */

function NavGroupSection({
  group,
  collapsed,
  isActive,
  onTabChange,
  hasActive,
  plan,
  onUpgrade,
}: {
  group: NavGroup;
  collapsed: boolean;
  isActive: (id: Tab) => boolean;
  onTabChange: (tab: Tab) => void;
  hasActive: boolean;
  plan: Plan;
  onUpgrade: () => void;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? false);

  if (collapsed) {
    return (
      <div className="flex flex-col gap-0.5">
        {group.items.map(item => {
          const locked = item.featureGate ? !canAccess(plan, item.featureGate) : false;
          return (
            <SidebarItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              active={isActive(item.id)}
              collapsed={collapsed}
              locked={locked}
              onClick={() => locked ? onUpgrade() : onTabChange(item.id)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={`flex w-full items-center gap-2 rounded-ws-button px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
          hasActive
            ? 'text-[var(--ws-text-secondary)]'
            : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'
        }`}
      >
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        <span>{group.title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-1 flex flex-col gap-0.5 border-l border-[var(--ws-glass-border)] pl-2 pt-0.5">
          {group.items.map(item => {
            const locked = item.featureGate ? !canAccess(plan, item.featureGate) : false;
            return (
              <SidebarItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                active={isActive(item.id)}
                collapsed={collapsed}
                locked={locked}
                onClick={() => locked ? onUpgrade() : onTabChange(item.id)}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---------- Sidebar Item ---------- */

function SidebarItem({
  id,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
  locked = false,
}: {
  id: Tab;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      data-ws-tooltip={collapsed ? (locked ? `${label} (Upgrade)` : label) : undefined}
      className={`group flex w-full items-center gap-3 rounded-ws-button px-3 py-2 text-sm font-medium transition-colors duration-150 ${
        active && !locked
          ? 'bg-[color-mix(in_srgb,var(--ws-accent)_12%,transparent)] text-[var(--ws-accent)]'
          : 'text-[var(--ws-text-tertiary)] hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-text-secondary)]'
      } ${locked ? 'opacity-70 hover:opacity-100' : ''} ${collapsed ? 'relative justify-center px-2' : ''}`}
      aria-current={active && !locked ? 'page' : undefined}
    >
      <Icon size={18} className="shrink-0" />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            className="truncate"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {locked && !collapsed && (
        <Lock
          size={12}
          className="ml-auto shrink-0 text-[var(--ws-gold)]"
        />
      )}
      {locked && collapsed && (
        <Lock
          size={8}
          className="absolute right-1 top-1 shrink-0 text-[var(--ws-gold)]"
        />
      )}
    </button>
  );
}
