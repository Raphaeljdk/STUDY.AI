'use client';

import { useState, useEffect, Component, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { HeaderZen } from '@/components/studyai/HeaderZen';
import { HeroSection } from '@/components/studyai/HeroSection';
import { FeaturesSection } from '@/components/studyai/FeaturesSection';
import { HowItWorksSection } from '@/components/studyai/HowItWorksSection';
import { AIChatPanel } from '@/components/studyai/AIChatPanel';
import { FooterZen } from '@/components/studyai/FooterZen';
import { AuthModal } from '@/components/studyai/AuthModal';
import dynamic from 'next/dynamic';
import { AlertCircle, RotateCcw } from 'lucide-react';

const DashboardView = dynamic(() => import('@/components/studyai/DashboardView').then(m => ({ default: m.DashboardView })), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ws-bg)]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--ws-glass-border)] border-t-[var(--ws-accent)]" />
        <p className="text-sm text-[var(--ws-text-tertiary)]">Carregando seu espaco de estudo...</p>
      </div>
    </div>
  ),
});

// Error Boundary class component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ws-bg)] p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ws-accent)]/10">
              <AlertCircle size={28} className="text-[var(--ws-accent)]" />
            </div>
            <h2 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">Ops, algo deu errado</h2>
            <p className="mt-2 text-sm text-[var(--ws-text-tertiary)]">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="mt-6 inline-flex items-center gap-2 rounded-ws-button bg-[var(--ws-accent)] px-5 py-2.5 text-sm font-medium text-[var(--ws-text-on-dark)] transition-colors hover:bg-[var(--ws-accent-hover)]"
            >
              <RotateCcw size={14} /> Tentar Novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Home() {
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Expose openAuth globally for HeaderZen to call
  useEffect(() => {
    (window as any).__studyai_openAuth = (mode?: 'login' | 'register') => {
      setAuthMode(mode || 'login');
      setAuthOpen(true);
    };
  }, []);

  // Loading
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ws-bg)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--ws-glass-border)] border-t-[var(--ws-accent)]" />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Carregando...</p>
        </div>
      </div>
    );
  }

  // Logged in -> Dashboard (with error boundary + dynamic import)
  if (session) {
    return (
      <ErrorBoundary>
        <DashboardView />
      </ErrorBoundary>
    );
  }

  // Not logged in -> Landing Page
  return (
    <div className="min-h-screen bg-[var(--ws-bg)]">
      <HeaderZen />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AIChatPanel />
      </main>
      <FooterZen />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
