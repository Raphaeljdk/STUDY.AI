'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, BarChart3, MessageCircle, Clock,
  LogOut, Settings, Shield, Users, ChevronRight, Star
} from 'lucide-react';
import { WabiSabiCard } from './WabiSabiCard';
import { ZenButton } from './ZenButton';
import { EnsoCircle } from './EnsoCircle';
import { AIChatPanel } from './AIChatPanel';
import { AdminPanel } from './AdminPanel';

const planLabels: Record<string, string> = { FREE: 'Shojin', SAMURAI: 'Samurai', SENSEI: 'Sensei' };
const planColors: Record<string, string> = { FREE: 'var(--ws-text-tertiary)', SAMURAI: 'var(--ws-accent)', SENSEI: 'var(--ws-gold)' };

const dashboardCards = [
  { Icon: BookOpen, title: 'Meus Cadernos', value: '0', desc: 'Cadernos ativos' },
  { Icon: Brain, title: 'Flashcards', value: '0', desc: 'Cartas para revisar' },
  { Icon: Clock, title: 'Horas Estudadas', value: '0h', desc: 'Esta semana' },
  { Icon: MessageCircle, title: 'Mensagens IA', value: '0', desc: 'Conversas com Sensei' },
];

type Tab = 'dashboard' | 'chat' | 'admin';

export function DashboardView() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-[var(--ws-bg)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 lg:px-24">
          <div className="flex items-center gap-3">
            <EnsoCircle size={32} strokeWidth={2} color="var(--ws-accent)" imperfection={0.1} animate={false} />
            <span className="font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">StudyAI</span>
          </div>

          {/* Tabs */}
          <nav className="hidden items-center gap-1 md:flex">
            <TabBtn icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabBtn icon={MessageCircle} label="Sensei IA" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
          </nav>

          {/* User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--ws-text-primary)]">{user?.name}</p>
              <p className="text-xs" style={{ color: planColors[user?.plan] || 'var(--ws-text-tertiary)' }}>
                {planLabels[user?.plan] || 'Free'}
                {isAdmin && ' · Admin'}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ws-glass-border)] font-serif-jp text-sm font-bold text-[var(--ws-accent)]">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden">
          <TabBtn icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabBtn icon={MessageCircle} label="Sensei" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          {isAdmin && <TabBtn icon={Shield} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-24">
        {activeTab === 'dashboard' && <DashboardContent user={user} />}
        {activeTab === 'chat' && <AIChatPanel />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </main>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'text-[var(--ws-accent)]'
          : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'
      }`}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
      {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--ws-accent)]" />}
    </button>
  );
}

function DashboardContent({ user }: { user: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)] lg:text-3xl">
          Konnichiwa, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
          Cada dia de estudo é um passo no caminho do conhecimento.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <WabiSabiCard>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                  <card.Icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
                </div>
                <ChevronRight size={16} className="text-[var(--ws-text-tertiary)]" />
              </div>
              <p className="mt-4 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-[var(--ws-text-secondary)]">{card.title}</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">{card.desc}</p>
            </WabiSabiCard>
          </motion.div>
        ))}
      </div>

      {/* Plan Card */}
      <WabiSabiCard className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[var(--ws-gold)]" fill="var(--ws-gold)" />
              <span className="text-sm font-semibold text-[var(--ws-text-primary)]">Plano Atual</span>
            </div>
            <p className="mt-1 font-serif-jp text-xl font-bold" style={{ color: planColors[user?.plan] || 'var(--ws-text-tertiary)' }}>
              {planLabels[user?.plan] || 'Free'}
            </p>
            <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">
              {user?.plan === 'FREE' && 'Faça upgrade para desbloquear todos os recursos'}
              {user?.plan === 'SAMURAI' && 'Acesso completo a IA e ferramentas avançadas'}
              {user?.plan === 'SENSEI' && 'Acesso máximo + tutoria personalizada e comunidade exclusiva'}
            </p>
          </div>
          {user?.plan === 'FREE' && (
            <ZenButton variant="primary" size="md">Fazer Upgrade</ZenButton>
          )}
        </div>
      </WabiSabiCard>

      {/* Quick Actions */}
      <h2 className="mb-4 font-serif-jp text-lg font-bold text-[var(--ws-text-primary)]">Acesso Rápido</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: BookOpen, title: 'Abrir Caderno', desc: 'Continue de onde parou' },
          { icon: Brain, title: 'Revisar Flashcards', desc: 'Spaced repetition ativo' },
          { icon: MessageCircle, title: 'Perguntar ao Sensei', desc: 'Tire dúvidas com IA' },
        ].map((action) => (
          <WabiSabiCard key={action.title} hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-ws-button" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
                <action.icon size={18} className="text-[var(--ws-accent)]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ws-text-primary)]">{action.title}</p>
                <p className="text-xs text-[var(--ws-text-tertiary)]">{action.desc}</p>
              </div>
            </div>
          </WabiSabiCard>
        ))}
      </div>
    </motion.div>
  );
}
