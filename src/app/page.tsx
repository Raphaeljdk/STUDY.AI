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

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[StudyAI ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || 'Erro desconhecido';
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--ws-bg)] p-6">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ws-accent)]/10">
              <AlertCircle size={28} className="text-[var(--ws-accent)]" />
            </div>
            <h2 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">Ops, algo deu errado</h2>
            <p className="mt-2 text-sm text-[var(--ws-text-tertiary)]">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <details className="mt-4 text-left rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-bg-dark)] p-3">
              <summary className="cursor-pointer text-xs font-medium text-[var(--ws-text-tertiary)]">Detalhes do erro</summary>
              <pre className="mt-2 overflow-auto max-h-40 text-xs text-[var(--ws-accent)] whitespace-pre-wrap break-all">{msg}</pre>
            </details>
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

  useEffect(() => {
    (window as any).__studyai_openAuth = (mode?: 'login' | 'register') => {
      setAuthMode(mode || 'login');
      setAuthOpen(true);
    };
  }, []);

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

  if (session) {
    return (
      <ErrorBoundary>
        <DashboardView />
      </ErrorBoundary>
    );
  }

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
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
