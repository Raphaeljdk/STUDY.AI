'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

function PWAProvider({ children }: { children: ReactNode }) {
  useServiceWorker();
  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="washi-paper"
        themes={['washi-paper', 'sumi-ink', 'koke-ishi', 'momiji', 'sakura']}
        enableSystem={false}
      >
        <PWAProvider>{children}</PWAProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
