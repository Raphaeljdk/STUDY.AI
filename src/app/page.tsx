'use client';

import { HeaderZen } from '@/components/studyai/HeaderZen';
import { HeroSection } from '@/components/studyai/HeroSection';
import { FeaturesSection } from '@/components/studyai/FeaturesSection';
import { HowItWorksSection } from '@/components/studyai/HowItWorksSection';
import { PricingSection } from '@/components/studyai/PricingSection';
import { AIChatPanel } from '@/components/studyai/AIChatPanel';
import { FooterZen } from '@/components/studyai/FooterZen';

export default function Home() {
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
    </div>
  );
}
