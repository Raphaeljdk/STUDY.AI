'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

import { DashboardView } from '@/components/studyai/DashboardView';
import { AuthModal } from '@/components/studyai/AuthModal';
import { HeaderZen } from '@/components/studyai/HeaderZen';
import { HeroSection } from '@/components/studyai/HeroSection';
import { FeaturesSection } from '@/components/studyai/FeaturesSection';
import { PricingSection } from '@/components/studyai/PricingSection';
import { FooterZen } from '@/components/studyai/FooterZen';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = useCallback((mode: 'login' | 'register' = 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  // Expose auth opener globally for landing page CTAs
  useEffect(() => {
    (window as any).__studyai_openAuth = openAuth;
    return () => { delete (window as any).__studyai_openAuth; };
  }, [openAuth]);

  // Loading state while session loads
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ws-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ws-accent)]" />
      </div>
    );
  }

  // Authenticated → full dashboard
  if (session) {
    return <DashboardView />;
  }

  // Not authenticated → landing page
  return (
    <>
      <HeaderZen />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <FooterZen />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
