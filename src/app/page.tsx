'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { HeaderZen } from '@/components/studyai/HeaderZen';
import { HeroSection } from '@/components/studyai/HeroSection';
import { FeaturesSection } from '@/components/studyai/FeaturesSection';
import { HowItWorksSection } from '@/components/studyai/HowItWorksSection';
import { PricingSection } from '@/components/studyai/PricingSection';
import { AIChatPanel } from '@/components/studyai/AIChatPanel';
import { FooterZen } from '@/components/studyai/FooterZen';
import { AuthModal } from '@/components/studyai/AuthModal';
import { DashboardView } from '@/components/studyai/DashboardView';

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

  // Logged in -> Dashboard
  if (session) {
    return <DashboardView />;
  }

  // Not logged in -> Landing Page
  return (
    <div className="min-h-screen bg-[var(--ws-bg)]">
      <HeaderZen />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
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
