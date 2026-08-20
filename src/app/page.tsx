'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

import { AuthModal } from '@/components/studyai/AuthModal';
import { HeaderZen } from '@/components/studyai/HeaderZen';
import { HeroSection } from '@/components/studyai/HeroSection';
import { FeaturesSection } from '@/components/studyai/FeaturesSection';
import { PricingSection } from '@/components/studyai/PricingSection';
import { FooterZen } from '@/components/studyai/FooterZen';
import { Loader2 } from 'lucide-react';

const DashboardView = dynamic(
  () => import('@/components/studyai/DashboardView').then(mod => ({ default: mod.DashboardView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ws-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ws-accent)]" />
      </div>
    ),
  }
);

export type OpenAuthOptions = {
  mode?: 'login' | 'register';
  plan?: 'SAMURAI' | 'SENSEI';
  billing?: 'monthly' | 'annual';
};

export default function Home() {
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [modalKey, setModalKey] = useState(0);

  const openAuth = useCallback((modeOrOpts: 'login' | 'register' | OpenAuthOptions = 'register') => {
    if (typeof modeOrOpts === 'string') {
      setAuthMode(modeOrOpts);
      if (typeof window !== 'undefined') {
        window.__studyai_pendingPlan = undefined;
        window.__studyai_pendingBilling = 'monthly';
      }
    } else {
      setAuthMode(modeOrOpts.mode || 'register');
      if (typeof window !== 'undefined') {
        window.__studyai_pendingPlan = modeOrOpts.plan;
        window.__studyai_pendingBilling = modeOrOpts.billing || 'monthly';
      }
    }
    setModalKey(k => k + 1);
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
        key={modalKey}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
